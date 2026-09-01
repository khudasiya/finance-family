import { describe, it, expect } from 'vitest';
import { calculateBudgetSplit } from '../services/budgetSplit.js';

describe('Market-Aware Budget Split Service', () => {
  const income = 200000;

  it('computes baseline allocation when market status is NEUTRAL', () => {
    const res = calculateBudgetSplit(income, 'NEUTRAL');
    expect(res.ratios.essentials).toBe(0.45);
    expect(res.ratios.savings).toBe(0.25);
    expect(res.ratios.investments).toBe(0.20);
    expect(res.ratios.discretionary).toBe(0.10);
    expect(res.amounts.invest_budget).toBe(40000);
    expect(res.amounts.save_budget).toBe(50000);
  });

  it('dynamically shifts +5% to investments when market status is BULLISH', () => {
    const res = calculateBudgetSplit(income, 'BULLISH');
    expect(res.ratios.investments).toBe(0.25);
    expect(res.ratios.savings).toBe(0.20);
    expect(res.amounts.invest_budget).toBe(50000);
    expect(res.amounts.save_budget).toBe(40000);
  });

  it('dynamically shifts -5% from investments to savings when market status is BEARISH', () => {
    const res = calculateBudgetSplit(income, 'BEARISH');
    expect(res.ratios.investments).toBe(0.15);
    expect(res.ratios.savings).toBe(0.30);
    expect(res.amounts.invest_budget).toBe(30000);
    expect(res.amounts.save_budget).toBe(60000);
  });
});
