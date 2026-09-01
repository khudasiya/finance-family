export interface GoalInput {
  id: number;
  description: string;
  target_amount: number;
  horizon_years: number;
  user_importance: number; // 1 to 10
  status?: string;
  custom_allocated_amount?: number | null;
}

export interface RankedGoal extends GoalInput {
  priority_rank: number;
  calculated_score: number;
  urgency_score: number;
  amount_ratio_score: number;
  importance_score: number;
  allocated_invest_amount: number;
  required_monthly_savings: number;
  health_status: 'PROTECTED' | 'ON_TRACK' | 'AT_RISK';
  projected_completion_months: number;
  funding_gap: number; // shortfall per month (0 if fully funded)
  is_custom_allocated?: boolean;
  explanation: string;
}

export interface ProjectionPoint {
  year: number;
  month: number;
  label: string;
  withPlan: number;
  withoutPlan: number;
}

export interface GoalRankingResult {
  rankedGoals: RankedGoal[];
  totalInvestBucket: number;
  totalMonthlyIncome: number;
  totalGoalsMonthlyNeeded: number;
  surplusWealthAllocation: number;
  overallHealth: 'HEALTHY' | 'MODERATE' | 'NEEDS_ATTENTION';
  healthSummary: string;
  projection5Year: ProjectionPoint[];
}

/**
 * Priority-order waterfall allocation with support for Manual Goal Allocation Overrides.
 *
 * 1. Score every goal (urgency 45%, importance 35%, scale 20%).
 * 2. Calculate exact Future-Value-of-Annuity required monthly payment for each goal.
 * 3. Support Manual Allocation Overrides: If a goal has custom_allocated_amount set,
 *    reserve that exact amount first.
 * 4. Priority waterfall allocates remaining investment pool among unassigned goals.
 * 5. Generate real-time 5-year compounding wealth trajectory curve.
 */
export function rankGoalsAndAllocate(
  goals: GoalInput[],
  totalMonthlyIncome: number,
  investBucket: number,
  saveBucket: number = 0,
  marketTrend: string = 'NEUTRAL',
  shortTermDiscretionarySpend: number = 0
): GoalRankingResult {
  if (goals.length === 0) {
    return {
      rankedGoals: [],
      totalInvestBucket: investBucket,
      totalMonthlyIncome,
      totalGoalsMonthlyNeeded: 0,
      surplusWealthAllocation: investBucket,
      overallHealth: 'HEALTHY',
      healthSummary: 'No goals registered yet. Your full investment pool compounds in the General Wealth Fund.',
      projection5Year: generate5YearProjection(investBucket, 0, saveBucket, totalMonthlyIncome, marketTrend)
    };
  }

  const annualIncome = Math.max(1, totalMonthlyIncome * 12);

  // Market-aware annual return
  let annualReturn = 0.10;
  if (marketTrend === 'BULLISH') annualReturn = 0.125;
  if (marketTrend === 'BEARISH') annualReturn = 0.07;
  const r = Math.pow(1 + annualReturn, 1 / 12) - 1; // monthly rate

  // ── Step 1: Score every goal ──────────────────────────────────────────
  const scored = goals.map(goal => {
    const urgencyScore = Math.min(1.0, 1.0 / Math.max(0.2, goal.horizon_years));
    const amountRatioScore = Math.min(1.0, goal.target_amount / annualIncome);
    const importanceScore = Math.max(0.1, Math.min(1.0, goal.user_importance / 10.0));

    const compositeScore = Number(
      (0.45 * urgencyScore + 0.35 * importanceScore + 0.20 * amountRatioScore).toFixed(4)
    );

    // Future-Value-of-Annuity required monthly payment
    const n = Math.max(1, Math.round(goal.horizon_years * 12));
    let requiredMonthly: number;
    if (r > 0) {
      requiredMonthly = (goal.target_amount * r) / (Math.pow(1 + r, n) - 1);
    } else {
      requiredMonthly = goal.target_amount / n;
    }

    const hasCustomAlloc = goal.custom_allocated_amount !== null && goal.custom_allocated_amount !== undefined && Number(goal.custom_allocated_amount) >= 0;

    return {
      ...goal,
      calculated_score: compositeScore,
      urgency_score: Number(urgencyScore.toFixed(3)),
      amount_ratio_score: Number(amountRatioScore.toFixed(3)),
      importance_score: Number(importanceScore.toFixed(3)),
      required_monthly_savings: Number(requiredMonthly.toFixed(2)),
      totalMonths: n,
      hasCustomAlloc,
      customAllocAmount: hasCustomAlloc ? Number(goal.custom_allocated_amount) : 0
    };
  });

  // ── Step 2: Sort by score (highest priority first) ────────────────────
  scored.sort((a, b) => b.calculated_score - a.calculated_score);

  const totalNeeded = scored.reduce((s, g) => s + g.required_monthly_savings, 0);

  // ── Step 3: Priority-order waterfall allocation + Manual Overrides ────
  // First reserve funds for manual goal overrides
  const customSum = scored.reduce((s, g) => s + (g.hasCustomAlloc ? g.customAllocAmount : 0), 0);
  let remainingPool = Math.max(0, Number((investBucket - customSum).toFixed(2)));

  const rankedGoals: RankedGoal[] = [];

  for (let i = 0; i < scored.length; i++) {
    const goal = scored[i];
    const rank = i + 1;

    let allocated: number;
    const isCustom = goal.hasCustomAlloc;

    if (isCustom) {
      // Goal has manual allocation override set by user
      allocated = goal.customAllocAmount;
    } else {
      // Goal receives allocation from remaining pool via priority waterfall
      allocated = Number(Math.min(goal.required_monthly_savings, Math.max(0, remainingPool)).toFixed(2));
      remainingPool = Number((remainingPool - allocated).toFixed(2));
    }

    // Projected completion: inverse annuity → months = ln(1 + T*r/P) / ln(1+r)
    let projectedMonths: number;
    if (allocated <= 0) {
      projectedMonths = 9999;
    } else if (r > 0) {
      projectedMonths = Math.ceil(Math.log(1 + (goal.target_amount * r) / allocated) / Math.log(1 + r));
    } else {
      projectedMonths = Math.ceil(goal.target_amount / allocated);
    }

    // Health status
    const fundingRatio = goal.required_monthly_savings > 0 ? allocated / goal.required_monthly_savings : 1;
    let health_status: 'PROTECTED' | 'ON_TRACK' | 'AT_RISK';
    if (fundingRatio >= 0.99) {
      health_status = 'PROTECTED';
    } else if (fundingRatio >= 0.50) {
      health_status = 'ON_TRACK';
    } else {
      health_status = 'AT_RISK';
    }

    const funding_gap = Number(Math.max(0, goal.required_monthly_savings - allocated).toFixed(2));

    let explanation: string;
    if (isCustom) {
      explanation = `Manually allocated ₹${allocated.toLocaleString()}/mo by user. Needed: ₹${goal.required_monthly_savings.toLocaleString()}/mo.`;
    } else if (health_status === 'PROTECTED') {
      explanation = `Fully funded at ₹${allocated.toLocaleString()}/mo → hits ₹${goal.target_amount.toLocaleString()} in ${goal.horizon_years} yrs on schedule.`;
    } else {
      explanation = `Allocated ₹${allocated.toLocaleString()}/mo of ₹${goal.required_monthly_savings.toLocaleString()}/mo needed. Short by ₹${funding_gap.toLocaleString()}/mo → completion delayed to ~${projectedMonths} months.`;
    }

    rankedGoals.push({
      ...goal,
      priority_rank: rank,
      allocated_invest_amount: allocated,
      health_status,
      projected_completion_months: projectedMonths,
      funding_gap,
      is_custom_allocated: isCustom,
      custom_allocated_amount: isCustom ? goal.customAllocAmount : null,
      explanation
    });
  }

  const surplusWealthAllocation = Number(Math.max(0, remainingPool).toFixed(2));

  // ── Step 4: Overall health ────────────────────────────────────────────
  const underfunded = rankedGoals.filter(g => g.health_status !== 'PROTECTED');
  let overallHealth: 'HEALTHY' | 'MODERATE' | 'NEEDS_ATTENTION';
  let healthSummary: string;

  if (underfunded.length === 0) {
    overallHealth = 'HEALTHY';
    healthSummary = 'All goals are 100% funded on schedule.';
  } else {
    overallHealth = underfunded.length <= 1 ? 'MODERATE' : 'NEEDS_ATTENTION';
    const names = underfunded.map(g => `"${g.description}" (short ₹${g.funding_gap.toLocaleString()}/mo)`).join(', ');
    healthSummary = `${underfunded.length} goal${underfunded.length > 1 ? 's' : ''} underfunded: ${names}. Consider increasing income or extending horizon.`;
  }

  const totalAllocatedAllGoals = rankedGoals.reduce((s, g) => s + g.allocated_invest_amount, 0);

  const projection5Year = generate5YearProjection(
    investBucket,
    totalAllocatedAllGoals,
    saveBucket,
    totalMonthlyIncome,
    marketTrend
  );

  return {
    rankedGoals,
    totalInvestBucket: investBucket,
    totalMonthlyIncome,
    totalGoalsMonthlyNeeded: Number(totalNeeded.toFixed(2)),
    surplusWealthAllocation,
    overallHealth,
    healthSummary,
    projection5Year
  };
}

/**
 * 5-year growth trajectory:
 *   "With Plan"    — monthly invest+save with compounding
 *   "Without Plan" — ad-hoc 12% of income at 2% p.a.
 */
export function generate5YearProjection(
  totalInvestBucket: number,
  allocatedInvest: number,
  saveBucket: number,
  monthlyIncome: number,
  marketTrend: string
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];

  let annualReturn = 0.10;
  if (marketTrend === 'BULLISH') annualReturn = 0.125;
  if (marketTrend === 'BEARISH') annualReturn = 0.07;

  const rInvest = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const rSave = Math.pow(1 + 0.045, 1 / 12) - 1;
  const rAdHoc = 0.02 / 12;
  const adHocMonthly = monthlyIncome * 0.12;

  let investWealth = 0;
  let saveWealth = 0;
  let withoutPlan = 0;

  for (let m = 0; m <= 60; m++) {
    if (m > 0) {
      investWealth = (investWealth + totalInvestBucket) * (1 + rInvest);
      saveWealth = (saveWealth + saveBucket) * (1 + rSave);
      withoutPlan = (withoutPlan + adHocMonthly) * (1 + rAdHoc);
    }

    const withPlan = investWealth + saveWealth;

    if (m % 12 === 0 || m === 60) {
      points.push({
        year: m / 12,
        month: m,
        label: m === 0 ? 'Start' : `Year ${m / 12}`,
        withPlan: Math.round(withPlan),
        withoutPlan: Math.round(withoutPlan)
      });
    }
  }

  return points;
}
