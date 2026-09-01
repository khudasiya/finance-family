import { describe, it, expect } from 'vitest';
import { solveKnapsack, PurchaseItem } from '../services/knapsack.js';

describe('0/1 Knapsack Dynamic Programming Service', () => {
  it('correctly selects optimal subset maximizing priority value within budget', () => {
    const items: PurchaseItem[] = [
      { id: 1, item_name: 'Laptop', amount: 40000, category: 'Electronics', priority_weight: 8 },
      { id: 2, item_name: 'Chair', amount: 15000, category: 'Furniture', priority_weight: 9 },
      { id: 3, item_name: 'Monitor', amount: 20000, category: 'Electronics', priority_weight: 7 },
      { id: 4, item_name: 'Coffee Maker', amount: 10000, category: 'Appliances', priority_weight: 4 }
    ];
    const capacity = 50000;

    const result = solveKnapsack(items, capacity);

    // Total cost must not exceed capacity (50,000)
    expect(result.totalCost).toBeLessThanOrEqual(capacity);
    expect(result.capacity).toBe(capacity);

    expect(result.totalValue).toBeGreaterThanOrEqual(17);
    expect(result.accepted.map(i => i.id)).toContain(2); // Chair has highest priority 9
    expect(result.dpMatrix.grid.length).toBeGreaterThan(0);
    expect(Object.keys(result.explanations).length).toBe(items.length);
  });

  it('handles zero budget capacity gracefully', () => {
    const items: PurchaseItem[] = [
      { id: 1, item_name: 'Item 1', amount: 1000, category: 'General', priority_weight: 5 }
    ];
    const result = solveKnapsack(items, 0);

    expect(result.accepted.length).toBe(0);
    expect(result.deferred.length).toBe(1);
    expect(result.totalCost).toBe(0);
    expect(result.explanations[1].accepted).toBe(false);
  });

  it('provides detailed explanation for deferred items exceeding capacity', () => {
    const items: PurchaseItem[] = [
      { id: 1, item_name: 'Car', amount: 500000, category: 'Auto', priority_weight: 10 }
    ];
    const result = solveKnapsack(items, 15000);

    expect(result.deferred.length).toBe(1);
    expect(result.explanations[1].reason).toContain('exceeds the entire Discretionary budget cap');
  });
});
