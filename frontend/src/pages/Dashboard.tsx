import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Target,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Edit3,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  ArrowUpRight,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Film,
  PlusCircle,
  PiggyBank,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Goal, Family, deleteGoal, deletePurchase, updatePlanBudget } from '../services/api';
import { GoalProjectionChart } from '../components/GoalProjectionChart';
import { EditGoalModal } from '../components/EditGoalModal';
import { EditIncomeModal } from '../components/EditIncomeModal';
import { EditBudgetModal } from '../components/EditBudgetModal';
import { MasterRecalibrateModal } from '../components/MasterRecalibrateModal';
import { EditExpensesModal } from '../components/EditExpensesModal';

interface DashboardProps {
  planData: any;
  onSimulateMarket: (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => void;
  onNavigateTab: (tab: string) => void;
  onRefreshPlan?: () => void;
  onFamilyUpdated?: (updated: Family) => void;
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  planData,
  onSimulateMarket,
  onNavigateTab,
  onRefreshPlan,
  onFamilyUpdated,
  loading = false
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [timeRange, setTimeRange] = useState('This Month');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [recIndex, setRecIndex] = useState(0);

  // Custom Category Breakdown state (only shown if user explicitly itemizes living expenses)
  const [customBreakdown, setCustomBreakdown] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('ff_category_breakdown');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  if (!planData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading financial overview...</p>
      </div>
    );
  }

  const { family, plan, knapsackResult, goalRankingResult } = planData;

  const totalIncome = Number(family.total_monthly_income);
  const spendBudget = Number(plan.spend_budget);
  const saveBudget = Number(plan.save_budget);
  const effectiveSaveBudget = Number(plan.effective_save_budget || plan.save_budget);
  const investBudget = Number(plan.invest_budget);
  const discretionaryCap = Number(plan.discretionary_budget);

  // Knapsack & Goals data
  const acceptedPurchases = knapsackResult?.accepted || [];
  const totalShortTermSpent = knapsackResult?.totalCost || 0;
  const rankedGoals = goalRankingResult?.rankedGoals || [];
  const overallHealth = goalRankingResult?.overallHealth || 'HEALTHY';
  const healthSummary = goalRankingResult?.healthSummary || 'All goals are funded on schedule.';

  // Build clean Living Expenses breakdown (0 phantom hardcoded categories!)
  const hasCustomBreakdown = customBreakdown !== null && customBreakdown !== undefined;
  let donutData: any[] = [];
  let displayTotalExpenses = spendBudget;

  if (hasCustomBreakdown) {
    const housingVal = customBreakdown?.housing ?? 0;
    const foodVal = customBreakdown?.food ?? 0;
    const transportVal = customBreakdown?.transport ?? 0;
    const utilitiesVal = customBreakdown?.utilities ?? 0;
    const healthcareVal = customBreakdown?.healthcare ?? 0;
    const leisureVal = customBreakdown?.leisure ?? 0;

    const totalCalculatedExpenses = housingVal + foodVal + transportVal + utilitiesVal + healthcareVal + leisureVal;
    displayTotalExpenses = totalCalculatedExpenses > 0 ? totalCalculatedExpenses : spendBudget;

    if (housingVal > 0) donutData.push({ name: 'Housing & Rent', value: housingVal, color: '#121c15', percent: `${Math.round((housingVal / displayTotalExpenses) * 100)}%`, icon: Home });
    if (foodVal > 0) donutData.push({ name: 'Food & Dining', value: foodVal, color: '#34d399', percent: `${Math.round((foodVal / displayTotalExpenses) * 100)}%`, icon: Utensils });
    if (transportVal > 0) donutData.push({ name: 'Transport & Fuel', value: transportVal, color: '#4ade80', percent: `${Math.round((transportVal / displayTotalExpenses) * 100)}%`, icon: Car });
    if (utilitiesVal > 0) donutData.push({ name: 'Bills & Utilities', value: utilitiesVal, color: '#10b981', percent: `${Math.round((utilitiesVal / displayTotalExpenses) * 100)}%`, icon: Zap });
    if (healthcareVal > 0) donutData.push({ name: 'Healthcare & Wellness', value: healthcareVal, color: '#86efac', percent: `${Math.round((healthcareVal / displayTotalExpenses) * 100)}%`, icon: HeartPulse });
    if (leisureVal > 0) donutData.push({ name: 'Leisure & Lifestyle', value: leisureVal, color: '#94a3b8', percent: `${Math.round((leisureVal / displayTotalExpenses) * 100)}%`, icon: Film });
  }

  // Fallback to single clean unallocated pool if user hasn't itemized expenses
  if (donutData.length === 0) {
    donutData = [
      { name: 'Unallocated Essentials Living Budget', value: spendBudget, color: '#10b981', percent: '100%', icon: Home }
    ];
  }

  const handleSaveBreakdown = async (newBreakdown: any, newTotalSpend?: number) => {
    setCustomBreakdown(newBreakdown);
    if (newBreakdown === null) {
      localStorage.removeItem('ff_category_breakdown');
    } else {
      localStorage.setItem('ff_category_breakdown', JSON.stringify(newBreakdown));
    }

    if (newTotalSpend !== undefined && newTotalSpend >= 0 && plan?.id) {
      try {
        await updatePlanBudget(plan.id, { spend_budget: newTotalSpend });
        if (onRefreshPlan) onRefreshPlan();
      } catch (err: any) {
        console.error('Failed to update spend budget:', err);
      }
    } else {
      if (onRefreshPlan) onRefreshPlan();
    }
  };

  const handleResetBreakdown = () => {
    setCustomBreakdown(null);
    localStorage.removeItem('ff_category_breakdown');
  };

  // Real recommendations (Zero fake bills)
  const recommendations = [
    {
      id: 1,
      icon: '🛒',
      title: 'Short-Term Want Pool',
      subtitle: acceptedPurchases[0]?.item_name ? `Approved: ${acceptedPurchases[0].item_name}` : `₹${discretionaryCap.toLocaleString()}/mo Discretionary Cap Active`,
      action: () => onNavigateTab('purchases')
    },
    {
      id: 2,
      icon: '🎯',
      title: 'Top Goal Target',
      subtitle: rankedGoals[0]?.description ? `Top Priority: ${rankedGoals[0].description}` : 'Set 5-Yr Wealth Goals',
      action: () => onNavigateTab('goals')
    },
    {
      id: 3,
      icon: '📈',
      title: 'Market Allocation',
      subtitle: `Invest ₹${investBudget.toLocaleString()}/mo in SIP Growth`,
      action: () => onNavigateTab('market')
    }
  ];

  const handleNextRec = () => {
    setRecIndex((prev) => (prev + 1) % recommendations.length);
  };

  const displayedRecs = [
    recommendations[recIndex % recommendations.length],
    recommendations[(recIndex + 1) % recommendations.length],
    recommendations[(recIndex + 2) % recommendations.length]
  ];

  // Real Recent Transactions (Zero fake Starbucks or Uber entries)
  const recentTransactions: any[] = [
    {
      id: 'tx-income',
      title: 'Monthly Household Income',
      time: 'Monthly Active Pool',
      amount: totalIncome,
      icon: ArrowUpRight,
      category: 'Income'
    }
  ];

  if (acceptedPurchases.length > 0) {
    acceptedPurchases.forEach((item: any) => {
      recentTransactions.push({
        id: `tx-purchase-${item.id}`,
        title: item.item_name,
        time: 'Approved Purchase',
        amount: -item.amount,
        icon: ShoppingBag,
        category: item.category || 'Purchases'
      });
    });
  }

  const totalIncomeDisplay = totalIncome.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const needsPct = Math.round((spendBudget / (totalIncome || 1)) * 100);
  const goalsWantsPct = Math.round(((investBudget + discretionaryCap) / (totalIncome || 1)) * 100);
  const savingsPct = Math.round((saveBudget / (totalIncome || 1)) * 100);

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteGoal(id);
      if (onRefreshPlan) onRefreshPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  const handleDeletePurchaseItem = async (id: number) => {
    try {
      await deletePurchase(id);
      if (onRefreshPlan) onRefreshPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ROW 1: Top 4 Metric Cards */}
      <section className="finai-metric-cards-grid">
        
        {/* 1. Total Household Income Hero Card */}
        <div
          className="finai-dark-card"
          onClick={() => setShowRecalibrateModal(true)}
          style={{ cursor: 'pointer' }}
          title="Click to edit Total Household Income and recalibrate allocations"
        >
          <div className="finai-dark-card-header">
            <span style={{ fontSize: '0.82rem' }}>Total Household Income</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
              style={{ background: 'transparent', border: 'none', color: '#8e9e92', cursor: 'pointer' }}
              title={showBalance ? 'Hide amount' : 'Show amount'}
            >
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="finai-dark-card-balance">
            {showBalance ? `₹${totalIncomeDisplay}` : '₹ ••••••••'}
          </div>

          <div className="finai-dark-pill">
            <ArrowUpRight size={13} />
            <span>Active Monthly Pool • Click to Edit</span>
          </div>
        </div>

        {/* 2. Monthly Expenses Card (Needs) */}
        <div
          className="finai-white-card"
          onClick={() => setShowExpensesModal(true)}
          style={{ cursor: 'pointer' }}
          title="Click to customize living expense categories"
        >
          <div className="finai-metric-header">
            <span className="finai-dot-indicator red" />
            <span>Monthly Expenses (Needs)</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-green-hover)', marginLeft: 'auto', fontWeight: 700 }}>Edit ↗</span>
          </div>
          <div className="finai-metric-value">
            ₹{spendBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="finai-trend-pill red">
            <ArrowUpRight size={13} />
            <span>{needsPct}% of Income (Living Budget)</span>
          </div>
        </div>

        {/* 3. Goals & Purchases Card (Investments & Wants) */}
        <div
          className="finai-white-card"
          onClick={() => onNavigateTab('goals')}
          style={{ cursor: 'pointer' }}
          title="Click to view Goals & Purchases Hub"
        >
          <div className="finai-metric-header">
            <span className="finai-dot-indicator green" />
            <span>Goals & Purchases (Wants + SIP)</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-green-hover)', marginLeft: 'auto', fontWeight: 700 }}>View ↗</span>
          </div>
          <div className="finai-metric-value">
            ₹{(investBudget + discretionaryCap).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="finai-trend-pill green">
            <ArrowUpRight size={13} />
            <span>{goalsWantsPct}% (₹{investBudget.toLocaleString()} Goals + ₹{discretionaryCap.toLocaleString()} Wants)</span>
          </div>
        </div>

        {/* 4. Cash Savings Reserve Card */}
        <div
          className="finai-white-card"
          onClick={() => setShowRecalibrateModal(true)}
          style={{ cursor: 'pointer' }}
          title="Click to adjust Cash Savings & Emergency Buffer"
        >
          <div className="finai-metric-header">
            <span className="finai-dot-indicator green" />
            <span>Cash Savings Reserve</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-green-hover)', marginLeft: 'auto', fontWeight: 700 }}>Edit ↗</span>
          </div>
          <div className="finai-metric-value">
            ₹{saveBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="finai-trend-pill green">
            <ArrowUpRight size={13} />
            <span>{savingsPct}% Liquid Cash Reserve</span>
          </div>
        </div>
      </section>

      {/* ROW 2: Itemized Living Expense Breakdown & Quick Actions */}
      <section className="finai-dashboard-split-row">
        
        {/* Left: Spending Overview Card (0 Phantom Hardcoded Items!) */}
        <div className="finai-spending-card">
          <div className="finai-card-title-bar">
            <h2 className="finai-section-title">Itemized Living Expense Breakdown</h2>
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              {hasCustomBreakdown && (
                <button
                  className="finai-ai-prompt-chip"
                  onClick={handleResetBreakdown}
                  style={{ color: 'var(--accent-rose)' }}
                  title="Reset to clean unallocated budget"
                >
                  Reset Breakdown
                </button>
              )}
              <button
                className="finai-ai-prompt-chip"
                onClick={() => setShowExpensesModal(true)}
                title="Customize category expense targets"
              >
                {hasCustomBreakdown ? 'Edit Breakdown ↗' : '+ Itemize Categories ↗'}
              </button>
            </div>
          </div>

          <div className="finai-spending-subtitle">
            Total Monthly Living Budget: <strong>₹{displayTotalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>

          <div className="finai-spending-content-grid">
            {/* Donut Chart */}
            <div className="finai-donut-container">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#121c15',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.78rem'
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Budget']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="finai-donut-center-label">
                <div className="finai-donut-center-sub">Living Pool</div>
                <div className="finai-donut-center-main">{hasCustomBreakdown ? 'Customized' : 'Essentials'}</div>
              </div>
            </div>

            {/* Category Breakdown List (Clean Slate, Zero Phantom Items) */}
            <div className="finai-category-list">
              {donutData.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <div key={idx} className="finai-category-item">
                    <div className="finai-cat-left">
                      <div className="finai-cat-icon">
                        <IconComponent size={14} />
                      </div>
                      <span>{cat.name}</span>
                    </div>

                    <div className="finai-cat-right">
                      <span className="finai-cat-amount">₹{cat.value.toLocaleString()}</span>
                      <span className="finai-cat-percent">{cat.percent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Financial Recalibration */}
        <div className="finai-stacked-right-col">
          
          <div className="finai-quick-actions-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="finai-section-title" style={{ fontSize: '0.95rem' }}>Quick Actions</h3>
                <button
                  className="finai-ai-prompt-chip"
                  onClick={() => setShowRecalibrateModal(true)}
                  style={{ fontSize: '0.72rem', color: 'var(--accent-green-hover)' }}
                >
                  ⚡ Master Recalibrate
                </button>
              </div>
              
              <div className="finai-actions-grid">
                <button
                  className="finai-action-btn"
                  onClick={() => onNavigateTab('spending')}
                  title="Log actual spending"
                >
                  <div className="finai-action-icon-tile">
                    <SlidersHorizontal size={18} />
                  </div>
                  <span className="finai-action-label">Log Spend</span>
                </button>

                <button
                  className="finai-action-btn"
                  onClick={() => setShowRecalibrateModal(true)}
                  title="Recalibrate full income & budget split"
                >
                  <div className="finai-action-icon-tile">
                    <PlusCircle size={18} />
                  </div>
                  <span className="finai-action-label">Edit Income</span>
                </button>

                <button
                  className="finai-action-btn"
                  onClick={() => onNavigateTab('goals')}
                  title="View Unified Goals & Purchases"
                >
                  <div className="finai-action-icon-tile">
                    <PiggyBank size={18} />
                  </div>
                  <span className="finai-action-label">Goals Hub</span>
                </button>

                <button
                  className="finai-action-btn"
                  onClick={() => setShowExpensesModal(true)}
                  title="Customize living expense categories"
                >
                  <div className="finai-action-icon-tile">
                    <Layers size={18} />
                  </div>
                  <span className="finai-action-label">Itemize Needs</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', background: 'var(--card-bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Discretionary Wants Cap
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '0.1rem' }}>
                ₹{totalShortTermSpent.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ ₹{discretionaryCap.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ROW 3: Recommendations & Real Transactions */}
      <section className="finai-dashboard-split-row">
        
        {/* Left: AI Recommendations */}
        <div className="finai-recs-card">
          <div className="finai-card-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={16} color="var(--accent-green)" />
              <h3 className="finai-section-title" style={{ fontSize: '0.98rem' }}>Household Recommendations</h3>
            </div>
            <button
              onClick={() => onNavigateTab('goals')}
              className="finai-view-all-link"
              style={{ background: 'transparent', border: 'none' }}
            >
              View All Goals
            </button>
          </div>

          <div className="finai-recs-carousel">
            {displayedRecs.map((rec, index) => (
              <div
                key={index}
                className="finai-rec-item"
                onClick={rec.action}
              >
                <div className="finai-rec-icon-box">
                  <span>{rec.icon}</span>
                </div>
                <div>
                  <div className="finai-rec-title">{rec.title}</div>
                  <div className="finai-rec-sub">{rec.subtitle}</div>
                </div>
              </div>
            ))}

            <button
              className="finai-rec-nav-arrow"
              onClick={handleNextRec}
              title="Next Recommendation"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Recent Transactions (Real User Data Only) */}
        <div className="finai-transactions-card">
          <div className="finai-card-title-bar">
            <h3 className="finai-section-title" style={{ fontSize: '0.98rem' }}>Recent Transactions</h3>
            <button
              onClick={() => onNavigateTab('spending')}
              className="finai-view-all-link"
              style={{ background: 'transparent', border: 'none' }}
            >
              View All
            </button>
          </div>

          <div className="finai-tx-list">
            {recentTransactions.map((tx) => {
              const TxIcon = tx.icon;
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="finai-tx-row">
                  <div className="finai-tx-left">
                    <div className="finai-tx-icon-tile">
                      <TxIcon size={16} />
                    </div>
                    <div>
                      <div className="finai-tx-title">{tx.title}</div>
                      <div className="finai-tx-time">{tx.time}</div>
                    </div>
                  </div>

                  <div className={`finai-tx-amount ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* 5-Year Wealth Trajectory Chart Section */}
      <section className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">
            <TrendingUp size={20} color="var(--accent-emerald)" />
            <span>5-Year Wealth Trajectory (Real-Time Compounding Curve)</span>
          </h3>
        </div>
        <GoalProjectionChart data={goalRankingResult?.projection5Year || []} />
      </section>

      {/* MODALS */}
      {/* 1. Master Financial Balancer & Recalibrator Modal */}
      {showRecalibrateModal && (
        <MasterRecalibrateModal
          family={family}
          plan={plan}
          onClose={() => setShowRecalibrateModal(false)}
          onSuccess={() => {
            if (onRefreshPlan) onRefreshPlan();
          }}
        />
      )}

      {/* 2. Itemized Category Expenses Modal */}
      {showExpensesModal && (
        <EditExpensesModal
          totalSpendBudget={spendBudget}
          initialBreakdown={customBreakdown}
          onClose={() => setShowExpensesModal(false)}
          onSave={handleSaveBreakdown}
        />
      )}

      {/* 3. Income Edit Modal */}
      {showIncomeModal && (
        <EditIncomeModal
          family={family}
          onClose={() => setShowIncomeModal(false)}
          onSuccess={(updatedFam) => {
            if (onFamilyUpdated) onFamilyUpdated(updatedFam);
            if (onRefreshPlan) onRefreshPlan();
          }}
        />
      )}

      {/* 4. Budget Allocation Modal */}
      {showBudgetModal && (
        <EditBudgetModal
          planId={plan.id}
          totalIncome={totalIncome}
          currentSpend={spendBudget}
          currentInvest={investBudget}
          currentDiscretionary={discretionaryCap}
          currentSave={saveBudget}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={() => {
            if (onRefreshPlan) onRefreshPlan();
          }}
        />
      )}

      {/* 5. Goal Edit Modal */}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSuccess={() => {
            if (onRefreshPlan) onRefreshPlan();
          }}
        />
      )}

    </div>
  );
};

export default Dashboard;
