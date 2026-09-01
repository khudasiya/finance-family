import { describe, it, expect } from 'vitest';
import { rankGoalsAndAllocate, GoalInput } from '../services/goalRanking.js';

describe('Multi-Factor Goal Ranking Service', () => {
  it('ranks goals by composite score and caps allocations at exact required monthly rates with surplus going to General Wealth Fund', () => {
    const goals: GoalInput[] = [
      { id: 1, description: 'Emergency Fund', target_amount: 300000, horizon_years: 1.0, user_importance: 10 },
      { id: 2, description: 'Vacation Fund', target_amount: 200000, horizon_years: 3.0, user_importance: 5 },
      { id: 3, description: 'Home Downpayment', target_amount: 1500000, horizon_years: 5.0, user_importance: 9 }
    ];

    const monthlyIncome = 150000;
    const investBucket = 30000;

    const result = rankGoalsAndAllocate(goals, monthlyIncome, investBucket);

    expect(result.rankedGoals.length).toBe(3);
    // Rank #1 should be Emergency Fund (horizon 1 yr, importance 10)
    expect(result.rankedGoals[0].id).toBe(1);
    expect(result.rankedGoals[0].priority_rank).toBe(1);

    // Verify goal target capping: A small goal target never absorbs absurd amounts
    const smallGoalRes = rankGoalsAndAllocate(
      [
        { id: 1, description: 'Small Goal', target_amount: 100, horizon_years: 10.0, user_importance: 8 },
        { id: 2, description: 'Medium Goal', target_amount: 600, horizon_years: 3.0, user_importance: 8 }
      ],
      monthlyIncome,
      investBucket
    );

    // Goal #1 (target ₹100 over 10 yrs) should receive at most ~₹0.50-₹1.00/mo, NOT ₹16,000/mo!
    const smallGoalAlloc = smallGoalRes.rankedGoals.find(g => g.id === 1)?.allocated_invest_amount || 0;
    expect(smallGoalAlloc).toBeLessThanOrEqual(2.0);

    // Total allocated across goals + surplus wealth fund must equal total invest bucket
    const totalAllocated = result.rankedGoals.reduce((sum, g) => sum + g.allocated_invest_amount, 0);
    const grandTotal = totalAllocated + result.surplusWealthAllocation;
    expect(Math.abs(grandTotal - investBucket)).toBeLessThanOrEqual(1.0);

    // Check 5-year projection dataset
    expect(result.projection5Year.length).toBeGreaterThan(0);
    const finalPoint = result.projection5Year[result.projection5Year.length - 1];
    expect(finalPoint.withPlan).toBeGreaterThan(finalPoint.withoutPlan);
  });
});
