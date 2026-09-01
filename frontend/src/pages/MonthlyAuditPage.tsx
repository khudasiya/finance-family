import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  Trophy,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  PlusCircle,
  Trash2,
  ArrowRight,
  AlertCircle,
  Zap,
  Award
} from 'lucide-react';
import { fetchAuditData, submitMonthlyAudit, deleteMonthlyAudit } from '../services/api';

interface MonthlyAuditPageProps {
  familyId: number;
  plannedEssentials: number;
  plannedDiscretionary: number;
  onRefreshPlan?: () => void;
}

export const MonthlyAuditPage: React.FC<MonthlyAuditPageProps> = ({
  familyId,
  plannedEssentials,
  plannedDiscretionary,
  onRefreshPlan
}) => {
  const [loading, setLoading] = useState(true);
  const [safeLockerBalance, setSafeLockerBalance] = useState(0);
  const [audits, setAudits] = useState<any[]>([]);
  const [goalProgress, setGoalProgress] = useState<any[]>([]);

  // Form State
  const [auditMonth, setAuditMonth] = useState(new Date().toISOString().slice(0, 7));
  const [actualEssentials, setActualEssentials] = useState('');
  const [actualDiscretionary, setActualDiscretionary] = useState('');
  const [goalSplitAmount, setGoalSplitAmount] = useState<number>(0);
  const [secretLockerSplitAmount, setSecretLockerSplitAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditData(familyId);
      setSafeLockerBalance(data.safeLockerBalance || 0);
      setAudits(data.audits || []);
      setGoalProgress(data.goalProgress || []);
    } catch (err: any) {
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadAuditData();
    }
  }, [familyId]);

  const actEss = Number(actualEssentials || 0);
  const actDisc = Number(actualDiscretionary || 0);
  const essSurplus = Math.max(0, plannedEssentials - actEss);
  const discSurplus = Math.max(0, plannedDiscretionary - actDisc);
  const calculatedSurplus = essSurplus + discSurplus;

  useEffect(() => {
    if (calculatedSurplus > 0 && goalSplitAmount === 0 && secretLockerSplitAmount === 0) {
      const half = Math.round(calculatedSurplus / 2);
      setGoalSplitAmount(half);
      setSecretLockerSplitAmount(calculatedSurplus - half);
    }
  }, [calculatedSurplus]);

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualEssentials && !actualDiscretionary) {
      alert('Please enter actual spent amounts for Essentials or Discretionary.');
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const res = await submitMonthlyAudit({
        family_id: familyId,
        audit_month: auditMonth,
        actual_essentials: actEss,
        actual_discretionary: actDisc,
        secret_saving_amount: secretLockerSplitAmount,
        long_term_goal_amount: goalSplitAmount,
        notes
      });

      setSafeLockerBalance(res.safeLockerBalance);
      if (res.notification) {
        setNotification(res.notification);
      }

      setActualEssentials('');
      setActualDiscretionary('');
      setNotes('');

      await loadAuditData();
      if (onRefreshPlan) onRefreshPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to submit monthly audit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAudit = async (id: number) => {
    if (!window.confirm('Delete this audit log entry?')) return;
    try {
      await deleteMonthlyAudit(id);
      await loadAuditData();
      if (onRefreshPlan) onRefreshPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to delete audit');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Monthly Audit & Safe Locker Engine...</p>
      </div>
    );
  }

  const topGoal = goalProgress[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Banner Notification if Goal Achieved */}
      {notification && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.3))',
            border: '2px solid var(--accent-green)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--accent-green)', padding: '0.75rem', borderRadius: '50%', color: '#fff' }}>
              <Trophy size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                🎉 GOAL ACHIEVED!
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {notification}
              </p>
            </div>
          </div>
          <button
            className="btn btn-emerald"
            onClick={() => setNotification(null)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Cards Section: Safe Locker Balance & Long-Term Goal Achievement Tracker */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>
        
        {/* 1. Safe Locker Balance Card */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(18, 28, 21, 0.95), rgba(24, 38, 28, 0.95))',
            border: '1px solid var(--accent-green-border)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'var(--accent-green-light)', padding: '0.5rem', borderRadius: '10px', color: 'var(--accent-green)' }}>
                <Lock size={20} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Safe Locker Accumulated Balance
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '20px', background: 'var(--accent-green-light)', color: 'var(--accent-green-hover)', fontWeight: 800 }}>
              🔒 Protected Vault
            </span>
          </div>

          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
            ₹{safeLockerBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--accent-green)" />
            <span>Accumulates unspent monthly surpluses to complete multi-year goals.</span>
          </div>
        </div>

        {/* 2. Top Long-Term Goal Completion Tracker */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            background: 'var(--card-bg-subtle)',
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--accent-green)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Long-Term Goal Progress
                </span>
              </div>
              {topGoal?.is_achieved && (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--accent-green)', color: '#fff' }}>
                  🎉 COMPLETED!
                </span>
              )}
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {topGoal ? topGoal.description : 'No Long-Term Goals Registered'}
            </div>

            {topGoal ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Target: <strong>₹{topGoal.target_amount.toLocaleString()}</strong> • Saved in Locker: <strong>₹{safeLockerBalance.toLocaleString()}</strong>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Add long-term goals in the Goals Hub to track auto-completion.
              </div>
            )}
          </div>

          {topGoal && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Locker Progress: {topGoal.progress_percent}%</span>
                <span style={{ fontWeight: 700, color: topGoal.remaining_gap === 0 ? 'var(--accent-green-hover)' : 'var(--accent-rose)' }}>
                  {topGoal.remaining_gap === 0 ? 'Goal 100% Achieved!' : `₹${topGoal.remaining_gap.toLocaleString()} Left to Complete`}
                </span>
              </div>

              <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${topGoal.progress_percent}%`,
                    background: topGoal.remaining_gap === 0 ? 'var(--accent-green)' : 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Monthly Audit Review Form */}
      <section className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Calendar size={22} color="var(--accent-green)" />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Monthly Expense Audit Review</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Review your actual spent vs planned budget for the month. Unspent funds are locked into your Safe Locker!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitAudit}>
          <div className="grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
            
            {/* 1. Audit Month Selection */}
            <div className="form-group">
              <label className="form-label">Audit Month</label>
              <input
                type="month"
                className="form-input"
                value={auditMonth}
                onChange={e => setAuditMonth(e.target.value)}
                required
              />
            </div>

            {/* 2. Actual Essentials Spent */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Actual Essentials Spent (₹)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned: ₹{plannedEssentials.toLocaleString()}</span>
              </div>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 55000"
                min="0"
                value={actualEssentials}
                onChange={e => setActualEssentials(e.target.value)}
                required
              />
            </div>

            {/* 3. Actual Discretionary Spent */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Actual Discretionary Spent (₹)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned: ₹{plannedDiscretionary.toLocaleString()}</span>
              </div>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 10000"
                min="0"
                value={actualDiscretionary}
                onChange={e => setActualDiscretionary(e.target.value)}
                required
              />
            </div>

          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Monthly Audit Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Saved ₹12,500 on groceries & utility bills"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Unspent Surplus Meter Preview & Custom Splitter */}
          {calculatedSurplus > 0 && (
            <div style={{ background: 'var(--card-bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid var(--accent-green)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Unspent Surplus Available: <strong style={{ color: 'var(--accent-green)', fontSize: '1.1rem' }}>+₹{calculatedSurplus.toLocaleString()}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Choose how to distribute this surplus between <strong>Long-Term Goals</strong> and your <strong>Secret Safe Locker</strong>.
                  </div>
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="finai-ai-prompt-chip"
                    onClick={() => {
                      setGoalSplitAmount(calculatedSurplus);
                      setSecretLockerSplitAmount(0);
                    }}
                  >
                    🎯 100% to Goals
                  </button>
                  <button
                    type="button"
                    className="finai-ai-prompt-chip"
                    onClick={() => {
                      const half = Math.round(calculatedSurplus / 2);
                      setGoalSplitAmount(half);
                      setSecretLockerSplitAmount(calculatedSurplus - half);
                    }}
                  >
                    ⚖️ 50/50 Split
                  </button>
                  <button
                    type="button"
                    className="finai-ai-prompt-chip"
                    onClick={() => {
                      setGoalSplitAmount(0);
                      setSecretLockerSplitAmount(calculatedSurplus);
                    }}
                  >
                    🤫 100% Secret Locker
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>🎯 Long-Term Goals Share (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max={calculatedSurplus}
                    value={goalSplitAmount}
                    onChange={e => {
                      const val = Math.min(calculatedSurplus, Math.max(0, Number(e.target.value || 0)));
                      setGoalSplitAmount(val);
                      setSecretLockerSplitAmount(calculatedSurplus - val);
                    }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>🤫 Secret Safe Locker Share (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max={calculatedSurplus}
                    value={secretLockerSplitAmount}
                    onChange={e => {
                      const val = Math.min(calculatedSurplus, Math.max(0, Number(e.target.value || 0)));
                      setSecretLockerSplitAmount(val);
                      setGoalSplitAmount(calculatedSurplus - val);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-emerald"
              disabled={submitting}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, width: '100%' }}
            >
              <Lock size={16} />
              <span>{submitting ? 'Locking In...' : `🔒 Lock In Month-End Surplus (+₹${calculatedSurplus.toLocaleString()}) & Update Goals`}</span>
            </button>
          </div>

        </form>
      </section>

      {/* Monthly Audit History Ledger */}
      <section className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
            <ShieldCheck size={20} color="var(--accent-green)" />
            <span>Monthly Audit History & Safe Locker Ledger</span>
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {audits.length} Audit Log{audits.length !== 1 ? 's' : ''}
          </span>
        </div>

        {audits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            No monthly audit entries logged yet. Complete your first monthly expense review above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {audits.map((a) => (
              <div
                key={a.id}
                style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '1rem 1.15rem',
                  borderRadius: '12px',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{a.audit_month} Review</strong>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'var(--accent-green-light)', color: 'var(--accent-green-hover)', fontWeight: 700 }}>
                      +₹{Number(a.unspent_surplus).toLocaleString()} Locked
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Essentials: ₹{Number(a.actual_essentials).toLocaleString()} / ₹{Number(a.planned_essentials).toLocaleString()} • Discretionary: ₹{Number(a.actual_discretionary).toLocaleString()} / ₹{Number(a.planned_discretionary).toLocaleString()}
                  </div>
                  {a.notes && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                      "{a.notes}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteAudit(a.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Delete Audit Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default MonthlyAuditPage;
