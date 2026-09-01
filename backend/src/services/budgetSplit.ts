export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface BudgetSplit {
  totalIncome: number;
  marketTrend: MarketTrend;
  ratios: {
    essentials: number; // percentage e.g. 0.45
    savings: number;    // percentage e.g. 0.25
    investments: number;// percentage e.g. 0.20
    discretionary: number; // percentage e.g. 0.10
  };
  amounts: {
    spend_budget: number;       // essentials
    save_budget: number;        // savings
    invest_budget: number;      // investments
    discretionary_budget: number; // discretionary
  };
  explanation: string;
}

/**
 * Calculates household budget allocation based on income and live market trend signal.
 */
export function calculateBudgetSplit(
  totalIncome: number,
  marketTrend: MarketTrend = 'NEUTRAL',
  customInvestDelta: number = 0.05
): BudgetSplit {
  const sanitizedIncome = Math.max(0, totalIncome);

  // Baseline 50-30-20 inspired household breakdown:
  // Essentials: 45%, Savings: 25%, Investments: 20%, Discretionary: 10%
  let essentialsRatio = 0.45;
  let savingsRatio = 0.25;
  let investmentsRatio = 0.20;
  let discretionaryRatio = 0.10;

  let explanation = `Baseline allocation active (Essentials 45%, Savings 25%, Investments 20%, Discretionary 10%). Market status is NEUTRAL.`;

  if (marketTrend === 'BULLISH') {
    // Shift investment ratio up by delta (default +5%), taken from savings
    investmentsRatio += customInvestDelta;
    savingsRatio -= customInvestDelta;
    explanation = `Market trend is BULLISH (+Favorable). Investment allocation dynamically increased by +${customInvestDelta * 100}% (to ${(investmentsRatio * 100).toFixed(0)}%) by shifting funds from cash savings to capture compounding market tailwinds.`;
  } else if (marketTrend === 'BEARISH') {
    // Shift investment ratio down by delta (default -5%), moved to safe cash savings
    investmentsRatio -= customInvestDelta;
    savingsRatio += customInvestDelta;
    explanation = `Market trend is BEARISH (-Unfavorable). Investment allocation dynamically reduced by -${customInvestDelta * 100}% (to ${(investmentsRatio * 100).toFixed(0)}%) to preserve capital, shifting allocation into safe cash savings.`;
  }

  investmentsRatio = Number(investmentsRatio.toFixed(4));
  savingsRatio = Number(savingsRatio.toFixed(4));
  essentialsRatio = Number(essentialsRatio.toFixed(4));
  discretionaryRatio = Number(discretionaryRatio.toFixed(4));

  const spend_budget = Number((sanitizedIncome * essentialsRatio).toFixed(2));
  const save_budget = Number((sanitizedIncome * savingsRatio).toFixed(2));
  const invest_budget = Number((sanitizedIncome * investmentsRatio).toFixed(2));
  const discretionary_budget = Number((sanitizedIncome * discretionaryRatio).toFixed(2));

  return {
    totalIncome: sanitizedIncome,
    marketTrend,
    ratios: {
      essentials: essentialsRatio,
      savings: savingsRatio,
      investments: investmentsRatio,
      discretionary: discretionaryRatio
    },
    amounts: {
      spend_budget,
      save_budget,
      invest_budget,
      discretionary_budget
    },
    explanation
  };
}
