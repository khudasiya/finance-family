export interface PurchaseItem {
  id: number;
  item_name: string;
  amount: number; // cost
  category: string;
  priority_weight: number; // value (1-10)
  budget_type?: 'ESSENTIAL' | 'DISCRETIONARY';
}

export interface KnapsackResult {
  accepted: PurchaseItem[];
  deferred: PurchaseItem[];
  totalCost: number;
  totalValue: number;
  capacity: number;
  essentialsCapacity: number;
  essentialsSpent: number;
  dpMatrix: {
    itemNames: string[];
    capacityHeaders: number[];
    grid: number[][];
  };
  explanations: Record<number, { accepted: boolean; reason: string }>;
}

/**
 * Solves purchase allocation across Essentials (fixed needs) and Discretionary (0/1 Knapsack DP).
 */
export function solveKnapsack(
  items: PurchaseItem[],
  rawCapacity: number,
  essentialsCapacity: number = 67500
): KnapsackResult {
  const explanations: Record<number, { accepted: boolean; reason: string }> = {};

  if (items.length === 0) {
    return {
      accepted: [],
      deferred: [],
      totalCost: 0,
      totalValue: 0,
      capacity: rawCapacity,
      essentialsCapacity,
      essentialsSpent: 0,
      dpMatrix: { itemNames: [], capacityHeaders: [], grid: [] },
      explanations: {}
    };
  }

  // 1. Separate Essential Needs vs Discretionary Wants
  const essentialItems = items.filter(i => i.budget_type === 'ESSENTIAL');
  const discretionaryItems = items.filter(i => i.budget_type !== 'ESSENTIAL');

  const acceptedEssential: PurchaseItem[] = [];
  const deferredEssential: PurchaseItem[] = [];

  let currentEssentialsSpent = 0;
  for (const item of essentialItems) {
    if (currentEssentialsSpent + item.amount <= essentialsCapacity) {
      currentEssentialsSpent += item.amount;
      acceptedEssential.push(item);
      explanations[item.id] = {
        accepted: true,
        reason: `ACCEPTED into Essentials: Funded from your ₹${essentialsCapacity.toLocaleString()} Essentials Needs budget (Priority score: ${item.priority_weight}/10).`
      };
    } else {
      deferredEssential.push(item);
      explanations[item.id] = {
        accepted: false,
        reason: `DEFERRED: Cost ₹${item.amount.toLocaleString()} exceeds remaining Essentials budget (₹${(essentialsCapacity - currentEssentialsSpent).toLocaleString()} available of ₹${essentialsCapacity.toLocaleString()}).`
      };
    }
  }

  // 2. Solve 0/1 Knapsack DP for Discretionary Items against Discretionary Cap
  if (discretionaryItems.length === 0 || rawCapacity <= 0) {
    for (const item of discretionaryItems) {
      explanations[item.id] = {
        accepted: false,
        reason: rawCapacity <= 0
          ? `DEFERRED: Discretionary budget cap is ₹0.`
          : `DEFERRED: Evaluated by Discretionary optimization.`
      };
    }

    const allAccepted = [...acceptedEssential];
    const allDeferred = [...deferredEssential, ...discretionaryItems];

    return {
      accepted: allAccepted,
      deferred: allDeferred,
      totalCost: allAccepted.filter(i => i.budget_type !== 'ESSENTIAL').reduce((s, i) => s + i.amount, 0),
      totalValue: allAccepted.reduce((s, i) => s + i.priority_weight, 0),
      capacity: rawCapacity,
      essentialsCapacity,
      essentialsSpent: currentEssentialsSpent,
      dpMatrix: { itemNames: [], capacityHeaders: [], grid: [] },
      explanations
    };
  }

  // Scale step for DP Matrix visualization
  let scaleStep = 100;
  if (rawCapacity <= 100) scaleStep = 5;
  else if (rawCapacity <= 1000) scaleStep = 50;
  else if (rawCapacity <= 10000) scaleStep = 500;
  else scaleStep = Math.pow(10, Math.floor(Math.log10(rawCapacity)) - 1);

  const scaledCapacity = Math.floor(rawCapacity / scaleStep);
  const n = discretionaryItems.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(scaledCapacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = discretionaryItems[i - 1];
    const scaledCost = Math.ceil(item.amount / scaleStep);

    for (let w = 0; w <= scaledCapacity; w++) {
      if (scaledCost <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - scaledCost] + item.priority_weight);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let w = scaledCapacity;
  const acceptedDiscretionary: PurchaseItem[] = [];
  const deferredDiscretionary: PurchaseItem[] = [];

  for (let i = n; i > 0; i--) {
    const item = discretionaryItems[i - 1];
    const scaledCost = Math.ceil(item.amount / scaleStep);

    if (scaledCost <= w && dp[i][w] !== dp[i - 1][w]) {
      acceptedDiscretionary.unshift(item);
      w -= scaledCost;
    } else {
      deferredDiscretionary.unshift(item);
    }
  }

  const acceptedDiscIds = new Set(acceptedDiscretionary.map(i => i.id));
  let currentCostAcc = 0;
  let accumulatedValue = acceptedEssential.reduce((s, i) => s + i.priority_weight, 0);

  for (const item of discretionaryItems) {
    if (acceptedDiscIds.has(item.id)) {
      currentCostAcc += item.amount;
      accumulatedValue += item.priority_weight;
      explanations[item.id] = {
        accepted: true,
        reason: `ACCEPTED into Discretionary: Cost ₹${item.amount.toLocaleString()} fits within ₹${rawCapacity.toLocaleString()} discretionary cap (Priority score: ${item.priority_weight}/10). Cumulative spend is ₹${currentCostAcc.toLocaleString()} / ₹${rawCapacity.toLocaleString()}.`
      };
    }
  }

  const discTotalCost = acceptedDiscretionary.reduce((sum, item) => sum + item.amount, 0);

  for (const item of deferredDiscretionary) {
    if (item.amount > rawCapacity) {
      explanations[item.id] = {
        accepted: false,
        reason: `DEFERRED: Single item cost (₹${item.amount.toLocaleString()}) exceeds the entire Discretionary budget cap (₹${rawCapacity.toLocaleString()}). Mark item as 'Essential Need' if it is a mandatory living expense (Essentials budget has ₹${essentialsCapacity.toLocaleString()} allocated), or click 'Reallocate Budget' to expand your Discretionary Cap.`
      };
    } else {
      const unusedBudget = rawCapacity - discTotalCost;
      if (item.amount > unusedBudget) {
        explanations[item.id] = {
          accepted: false,
          reason: `DEFERRED: Cost ₹${item.amount.toLocaleString()} exceeds remaining discretionary cap of ₹${unusedBudget.toLocaleString()} after accepting higher-priority purchases.`
        };
      } else {
        explanations[item.id] = {
          accepted: false,
          reason: `DEFERRED: 0/1 Knapsack DP found a higher-value combination of discretionary items.`
        };
      }
    }
  }

  const capacityHeaders: number[] = [];
  const colCount = Math.min(scaledCapacity + 1, 15);
  const colStep = Math.max(1, Math.floor(scaledCapacity / (colCount - 1)));

  for (let c = 0; c <= scaledCapacity; c += colStep) {
    capacityHeaders.push(c * scaleStep);
  }
  if (capacityHeaders[capacityHeaders.length - 1] !== scaledCapacity * scaleStep) {
    capacityHeaders.push(scaledCapacity * scaleStep);
  }

  const itemNames = discretionaryItems.map(i => i.item_name);

  return {
    accepted: [...acceptedEssential, ...acceptedDiscretionary],
    deferred: [...deferredEssential, ...deferredDiscretionary],
    totalCost: discTotalCost,
    totalValue: accumulatedValue,
    capacity: rawCapacity,
    essentialsCapacity,
    essentialsSpent: currentEssentialsSpent,
    dpMatrix: {
      itemNames: ['Base (0 items)', ...itemNames],
      capacityHeaders,
      grid: dp.map(row => capacityHeaders.map(cap => {
        const scaledCapIndex = Math.min(Math.floor(cap / scaleStep), scaledCapacity);
        return row[scaledCapIndex] || 0;
      }))
    },
    explanations
  };
}
