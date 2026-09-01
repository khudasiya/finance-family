import { Router } from 'express';
import { db, withTransaction } from '../db/client.js';

const router = Router();

// GET Safe Locker & Monthly Audit summary for family
router.get('/', async (req, res) => {
  try {
    const familyId = req.query.family_id;
    if (!familyId) {
      return res.status(400).json({ error: 'family_id query parameter is required' });
    }

    // 1. Fetch or initialize Safe Locker balance
    let lockerRes = await db.query('SELECT * FROM safe_locker WHERE family_id = $1', [familyId]);
    if (lockerRes.rows.length === 0) {
      lockerRes = await db.query(
        'INSERT INTO safe_locker (family_id, total_balance) VALUES ($1, 0) RETURNING *',
        [familyId]
      );
    }
    const lockerBalance = Number(lockerRes.rows[0].total_balance);

    // 2. Fetch past monthly audits
    const auditLogsRes = await db.query(
      'SELECT * FROM monthly_audits WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    );

    // 3. Fetch active long-term goals and compute goal completion gap
    const goalsRes = await db.query(
      'SELECT * FROM goals WHERE family_id = $1 ORDER BY priority_rank ASC, id ASC',
      [familyId]
    );

    const goalProgress = goalsRes.rows.map(g => {
      const target = Number(g.target_amount);
      const allocated = Number(g.allocated_invest_amount || 0);
      const saved = Number(g.current_saved_amount || 0);
      const totalAccumulated = saved + lockerBalance;
      const isAchieved = totalAccumulated >= target || g.status === 'COMPLETED';
      const remainingGap = Math.max(0, target - totalAccumulated);
      const progressPercent = Math.min(100, Math.round((totalAccumulated / target) * 100));

      return {
        id: g.id,
        description: g.description,
        target_amount: target,
        horizon_years: Number(g.horizon_years),
        priority_rank: g.priority_rank,
        allocated_invest_amount: allocated,
        current_saved_amount: saved,
        locker_balance: lockerBalance,
        total_accumulated: totalAccumulated,
        remaining_gap: remainingGap,
        progress_percent: progressPercent,
        status: isAchieved ? 'COMPLETED' : g.status,
        is_achieved: isAchieved
      };
    });

    res.json({
      safeLockerBalance: lockerBalance,
      audits: auditLogsRes.rows,
      goalProgress
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Monthly Audit & deposit unspent surplus into Safe Locker / Long-Term Goals
router.post('/', async (req, res) => {
  try {
    const {
      family_id,
      audit_month,
      actual_essentials,
      actual_discretionary,
      secret_saving_amount,
      long_term_goal_amount,
      notes
    } = req.body;

    if (!family_id || !audit_month) {
      return res.status(400).json({ error: 'family_id and audit_month are required' });
    }

    const currentMonth = audit_month || new Date().toISOString().slice(0, 7);

    // 1. Fetch planned budget for the month
    const planRes = await db.query(
      'SELECT * FROM monthly_plans WHERE family_id = $1 AND month = $2',
      [family_id, currentMonth]
    );

    let plannedEssentials = 67500;
    let plannedDiscretionary = 15000;

    if (planRes.rows.length > 0) {
      const plan = planRes.rows[0];
      plannedEssentials = Number(plan.spend_budget);
      plannedDiscretionary = Number(plan.discretionary_budget);
    }

    const actEssentials = Number(actual_essentials || 0);
    const actDiscretionary = Number(actual_discretionary || 0);

    // Compute unspent surplus from budget
    const essentialsSurplus = Math.max(0, plannedEssentials - actEssentials);
    const discretionarySurplus = Math.max(0, plannedDiscretionary - actDiscretionary);
    const totalSurplus = Number((essentialsSurplus + discretionarySurplus).toFixed(2));

    // Determine custom split (Secret Locker vs Long-Term Goals)
    let secretLockerDeposit = totalSurplus;
    let goalDeposit = 0;

    if (secret_saving_amount !== undefined || long_term_goal_amount !== undefined) {
      secretLockerDeposit = Math.max(0, Number(secret_saving_amount || 0));
      goalDeposit = Math.max(0, Number(long_term_goal_amount || 0));
      // Cap at totalSurplus if sum exceeds
      const sum = secretLockerDeposit + goalDeposit;
      if (sum > totalSurplus && totalSurplus > 0) {
        const ratio = totalSurplus / sum;
        secretLockerDeposit = Number((secretLockerDeposit * ratio).toFixed(2));
        goalDeposit = Number((goalDeposit * ratio).toFixed(2));
      }
    }

    let updatedLockerBalance = 0;
    let auditRecord: any = null;
    let newlyAchievedGoals: any[] = [];

    await withTransaction(async (tx) => {
      // Record or update monthly audit
      const auditRes = await tx.query(
        `INSERT INTO monthly_audits
           (family_id, audit_month, planned_essentials, actual_essentials, planned_discretionary, actual_discretionary, unspent_surplus, transferred_to_locker, transferred_to_goals, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          family_id,
          currentMonth,
          plannedEssentials,
          actEssentials,
          plannedDiscretionary,
          actDiscretionary,
          totalSurplus,
          secretLockerDeposit,
          goalDeposit,
          notes || 'Month-end surplus distribution audit'
        ]
      );
      auditRecord = auditRes.rows[0];

      // Update or create safe locker balance
      const lockerCheck = await tx.query('SELECT * FROM safe_locker WHERE family_id = $1', [family_id]);
      if (lockerCheck.rows.length === 0) {
        const newLocker = await tx.query(
          'INSERT INTO safe_locker (family_id, total_balance) VALUES ($1, $2) RETURNING *',
          [family_id, secretLockerDeposit]
        );
        updatedLockerBalance = Number(newLocker.rows[0].total_balance);
      } else {
        const cur = Number(lockerCheck.rows[0].total_balance);
        const next = Number((cur + secretLockerDeposit).toFixed(2));
        const upLocker = await tx.query(
          'UPDATE safe_locker SET total_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE family_id = $2 RETURNING *',
          [next, family_id]
        );
        updatedLockerBalance = Number(upLocker.rows[0].total_balance);
      }

      // If surplus allocated to long-term goals, distribute into active goals
      if (goalDeposit > 0) {
        const activeGoalsForCredit = await tx.query(
          'SELECT * FROM goals WHERE family_id = $1 AND status != \'COMPLETED\' ORDER BY priority_rank ASC, id ASC',
          [family_id]
        );
        let remGoalSurplus = goalDeposit;
        for (const g of activeGoalsForCredit.rows) {
          if (remGoalSurplus <= 0) break;
          const curSaved = Number(g.current_saved_amount || 0);
          const target = Number(g.target_amount);
          const needed = Math.max(0, target - curSaved);
          const credit = Math.min(remGoalSurplus, needed > 0 ? needed : remGoalSurplus);
          const nextSaved = curSaved + credit;
          remGoalSurplus -= credit;

          await tx.query(
            'UPDATE goals SET current_saved_amount = $1 WHERE id = $2',
            [nextSaved, g.id]
          );
        }
      }

      // Check all active goals to see if locker balance OR saved amount hits target
      const activeGoals = await tx.query(
        'SELECT * FROM goals WHERE family_id = $1 AND status != \'COMPLETED\'',
        [family_id]
      );

      for (const goal of activeGoals.rows) {
        const target = Number(goal.target_amount);
        const saved = Number(goal.current_saved_amount || 0);
        if (updatedLockerBalance >= target || saved >= target || (updatedLockerBalance + saved) >= target) {
          await tx.query(
            "UPDATE goals SET status = 'COMPLETED' WHERE id = $1",
            [goal.id]
          );
          newlyAchievedGoals.push({
            ...goal,
            target_amount: target,
            status: 'COMPLETED'
          });
        }
      }
    });

    let notification = null;
    if (newlyAchievedGoals.length > 0) {
      const gNames = newlyAchievedGoals.map(g => `"${g.description}"`).join(', ');
      notification = `🎉 GOAL ACHIEVED! Your total savings reached goal milestones! Goal ${gNames} is 100% completed!`;
    }

    res.status(201).json({
      message: 'Monthly audit processed and surplus distributed successfully',
      audit: auditRecord,
      safeLockerBalance: updatedLockerBalance,
      secretLockerDeposit,
      goalDeposit,
      newlyAchievedGoals,
      notification
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE monthly audit record
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM monthly_audits WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    res.json({ message: 'Audit record deleted', deleted: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
