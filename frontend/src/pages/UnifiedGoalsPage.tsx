import React, { useState, useEffect } from 'react';
import { Target, ShoppingBag, Plus, Sparkles, CheckCircle2, XCircle, Trash2, Edit3, Award, TrendingUp, Sliders, ArrowRight, ArrowDownUp } from 'lucide-react';
import { Goal, Purchase, fetchGoalsData, addGoal, deleteGoal, addPurchase, deletePurchase, updatePlanBudget } from '../services/api';
import { GoalProjectionChart } from '../components/GoalProjectionChart';
import { EditGoalModal } from '../components/EditGoalModal';
import { EditBudgetModal } from '../components/EditBudgetModal';
import { MasterRecalibrateModal } from '../components/MasterRecalibrateModal';

interface UnifiedGoalsPageProps {
  familyId: number;
  planData: any;
  onRefreshParent: () => void;
}

export const UnifiedGoalsPage: React.FC<UnifiedGoalsPageProps> = ({
  familyId,
  planData,
  onRefreshParent
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'short' | 'long' | 'chart'>('all');
  const [goalsData, setGoalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Short-Term Purchase Form States
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory, setItemCategory] = useState('General');
  const [itemPriority, setItemPriority] = useState(8);
  const [itemBudgetType, setItemBudgetType] = useState<'DISCRETIONARY' | 'ESSENTIAL'>('DISCRETIONARY');

  // Long-Term Goal Form States
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalHorizon, setGoalHorizon] = useState('3.0');
  const [goalImportance, setGoalImportance] = useState(8);

  const [submitting, setSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);

  const plan = planData?.plan;
  const discretionaryCap = Number(plan?.discretionary_budget || 0);
  const investBudget = Number(plan?.invest_budget || 0);
  const spendBudget = Number(plan?.spend_budget || 0);
  const totalIncome = Number(planData?.family?.total_monthly_income || 0);
  const saveBudget = Number(plan?.save_budget || 0);

  const remainingLivingMoney = Math.max(0, totalIncome - investBudget);

  const [livingSpend, setLivingSpend] = useState<number>(spendBudget);
  const [livingDisc, setLivingDisc] = useState<number>(discretionaryCap);
  const [livingSave, setLivingSave] = useState<number>(saveBudget);
  const [savingLivingSplit, setSavingLivingSplit] = useState(false);

  useEffect(() => {
    setLivingSpend(spendBudget);
    setLivingDisc(discretionaryCap);
    setLivingSave(saveBudget);
  }, [spendBudget, discretionaryCap, saveBudget]);

  const handleApplyLivingSplit = async () => {
    if (!plan?.id) return;
    setSavingLivingSplit(true);
    try {
      await updatePlanBudget(plan.id, {
        spend_budget: livingSpend,
        discretionary_budget: livingDisc,
        invest_budget: investBudget
      });
      onRefreshParent();
      loadGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to update living budget split');
    } finally {
      setSavingLivingSplit(false);
    }
  };

  const handleLivingPreset = (ratioNeeds: number) => {
    const pool = remainingLivingMoney - livingSave;
    const needs = Math.round(pool * ratioNeeds);
    const wants = pool - needs;
    setLivingSpend(needs);
    setLivingDisc(wants);
  };

  const knapsackResult = planData?.knapsackResult;
  const purchases = planData?.purchases || [];
  const acceptedPurchases = knapsackResult?.accepted || [];
  const deferredPurchases = knapsackResult?.deferred || [];

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetchGoalsData(familyId);
      setGoalsData(res);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadGoals();
    }
  }, [familyId]);

  // Add Short-Term Item
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemAmount || Number(itemAmount) <= 0 || !plan?.id) return;

    setSubmitting(true);
    try {
      await addPurchase({
        plan_id: plan.id,
        item_name: itemName,
        amount: Number(itemAmount),
        category: itemCategory,
        priority_weight: Number(itemPriority),
        budget_type: itemBudgetType
      });
      setItemName('');
      setItemAmount('');
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to add purchase');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Long-Term Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDesc || !goalTarget || Number(goalTarget) <= 0) return;

    setSubmitting(true);
    try {
      await addGoal({
        family_id: familyId,
        description: goalDesc,
        target_amount: Number(goalTarget),
        horizon_years: Number(goalHorizon),
        user_importance: Number(goalImportance)
      });
      setGoalDesc('');
      setGoalTarget('');
      loadGoals();
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to add goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteGoal(id);
      loadGoals();
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  const handleDeletePurchase = async (id: number) => {
    try {
      await deletePurchase(id);
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase');
    }
  };

  const rankedGoals = goalsData?.rankingResult?.rankedGoals || [];
  const projectionData = goalsData?.rankingResult?.projection5Year || [];
  const totalLongTermTarget = rankedGoals.reduce((sum: number, g: any) => sum + Number(g.target_amount || 0), 0);
  const totalShortTermRequested = purchases.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Master Goals Header */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Target size={22} color="var(--accent-green)" />
              <span>Unified Goals & Purchases Command Center</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Simultaneously balance Short-Term Purchases (&lt;1 Year) via 0/1 Knapsack and Long-Term Wealth Goals (&gt;1 Year) via Priority Waterfall.
            </p>
          </div>

          <div className="finai-tab-pill-group">
            <button
              className={`finai-tab-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Goals ({purchases.length + rankedGoals.length})
            </button>
            <button
              className={`finai-tab-pill-btn ${activeTab === 'short' ? 'active' : ''}`}
              onClick={() => setActiveTab('short')}
            >
              Short-Term ({purchases.length})
            </button>
            <button
              className={`finai-tab-pill-btn ${activeTab === 'long' ? 'active' : ''}`}
              onClick={() => setActiveTab('long')}
            >
              Long-Term ({rankedGoals.length})
            </button>
            <button
              className={`finai-tab-pill-btn ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              5-Yr Wealth Model
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Pills + Quick Rebalancer Button */}
        <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Short-Term Purchases Cap: <strong style={{ color: '#8b5cf6' }}>₹{discretionaryCap.toLocaleString()}/mo</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Long-Term Investment Pool: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{investBudget.toLocaleString()}/mo</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Total Long-Term Target Value: <strong style={{ color: 'var(--text-primary)' }}>₹{totalLongTermTarget.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Knapsack Accepted Rate: <strong style={{ color: 'var(--accent-green)' }}>{acceptedPurchases.length}/{purchases.length} Items</strong>
          </div>
          <button
            type="button"
            className="finai-ai-prompt-chip"
            onClick={() => setShowRecalibrateModal(true)}
            style={{ color: 'var(--accent-green-hover)', fontWeight: 700, padding: '0.45rem 0.85rem' }}
            title="Shift funds between Short-Term Spending, Living Expenses, and Long-Term Goals"
          >
            ⚡ Shift & Rebalance Caps
          </button>
        </div>
      </div>

      {/* 2. Post-Goal Living Budget Splitter */}
      <div className="finai-card" style={{ background: 'var(--card-bg)', border: '1.5px solid var(--accent-green)', padding: '1.25rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sliders size={18} color="var(--accent-green)" />
              <span>💰 Post-Goal Living Cash Flow Splitter</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Monthly Income: <strong>₹{totalIncome.toLocaleString()}</strong> • Reserved for Long-Term Goals: <strong style={{ color: 'var(--accent-green)' }}>-₹{investBudget.toLocaleString()}</strong> • Remaining for Living: <strong style={{ color: '#8b5cf6' }}>₹{remainingLivingMoney.toLocaleString()}/mo</strong>
            </p>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" className="finai-ai-prompt-chip" onClick={() => handleLivingPreset(0.8)}>
              80% Needs / 20% Wants
            </button>
            <button type="button" className="finai-ai-prompt-chip" onClick={() => handleLivingPreset(0.7)}>
              70% Needs / 30% Wants
            </button>
            <button type="button" className="finai-ai-prompt-chip" onClick={() => handleLivingPreset(0.5)}>
              50/50 Split
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--card-bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>🛡️ Essential Needs Budget (₹/mo)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              value={livingSpend}
              onChange={e => {
                const val = Number(e.target.value || 0);
                setLivingSpend(val);
                setLivingDisc(Math.max(0, remainingLivingMoney - val - livingSave));
              }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>🛍️ Short-Term Purchases Cap (₹/mo)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              value={livingDisc}
              onChange={e => {
                const val = Number(e.target.value || 0);
                setLivingDisc(val);
                setLivingSpend(Math.max(0, remainingLivingMoney - val - livingSave));
              }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>🏦 Cash Reserve Buffer (₹/mo)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              value={livingSave}
              onChange={e => {
                const val = Number(e.target.value || 0);
                setLivingSave(val);
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyLivingSplit}
            disabled={savingLivingSplit}
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            <span>{savingLivingSplit ? 'Updating...' : '💾 Apply & Rebalance Living Pools'}</span>
          </button>
        </div>
      </div>

      {/* 3. Side-by-Side Unified Creation Forms */}
      {(activeTab === 'all' || activeTab === 'short' || activeTab === 'long') && (
        <div className="finai-dashboard-split-row">
          
          {/* Left: Short-Term Purchase Request Form */}
          {(activeTab === 'all' || activeTab === 'short') && (
            <div className="finai-card">
              <h3 className="finai-section-title" style={{ fontSize: '0.98rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShoppingBag size={16} color="#8b5cf6" />
                <span>Add Short-Term Purchase (&lt; 1 Year)</span>
              </h3>

              <form onSubmit={handleAddPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Item / Request Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ergonomic Chair / Refrigerator"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cost (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="12000"
                      min="1"
                      value={itemAmount}
                      onChange={e => setItemAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={itemCategory}
                      onChange={e => setItemCategory(e.target.value)}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Home Improvement">Home Improvement</option>
                      <option value="Leisure & Gear">Leisure & Gear</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Utility Priority (1-10)</label>
                    <span style={{ fontWeight: 800, color: '#8b5cf6' }}>{itemPriority}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={itemPriority}
                    onChange={e => setItemPriority(Number(e.target.value))}
                    style={{ accentColor: '#8b5cf6', cursor: 'pointer', width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#8b5cf6', color: '#fff', marginTop: '0.35rem' }}
                  disabled={submitting}
                >
                  <Plus size={15} />
                  <span>{submitting ? 'Adding...' : 'Add to 0/1 Knapsack Optimizer'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Right: Long-Term Goal Form */}
          {(activeTab === 'all' || activeTab === 'long') && (
            <div className="finai-card">
              <h3 className="finai-section-title" style={{ fontSize: '0.98rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Target size={16} color="var(--accent-green)" />
                <span>Add Long-Term Wealth Goal (&gt; 1 Year)</span>
              </h3>

              <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Goal Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Higher Education / House Down Payment"
                    value={goalDesc}
                    onChange={e => setGoalDesc(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="500000"
                      min="1"
                      value={goalTarget}
                      onChange={e => setGoalTarget(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Timeline (Years)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      placeholder="3"
                      min="0.5"
                      max="30"
                      value={goalHorizon}
                      onChange={e => setGoalHorizon(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Importance (1-10)</label>
                    <span style={{ fontWeight: 800, color: 'var(--accent-green-hover)' }}>{goalImportance}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={goalImportance}
                    onChange={e => setGoalImportance(Number(e.target.value))}
                    style={{ accentColor: 'var(--accent-green)', cursor: 'pointer', width: '100%' }}
                  />
                </div>

                {/* Real-time SIP & Living Deduction Live Preview */}
                {Number(goalTarget || 0) > 0 && (
                  <div style={{ background: 'var(--card-bg-subtle)', border: '1px solid var(--accent-green)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem' }}>
                    {(() => {
                      const t = Number(goalTarget || 0);
                      const h = Number(goalHorizon || 1);
                      const rM = 0.12 / 12;
                      const nM = Math.max(1, Math.round(h * 12));
                      const sip = Math.round((t * rM) / (Math.pow(1 + rM, nM) - 1));
                      const remAfter = Math.max(0, totalIncome - (investBudget + sip));
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span>Monthly Investment Needed:</span>
                            <strong style={{ color: 'var(--accent-green)' }}>₹{sip.toLocaleString()}/mo</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Remaining Living Budget:</span>
                            <strong>₹{remAfter.toLocaleString()}/mo</strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '0.35rem' }}
                  disabled={submitting}
                >
                  <Plus size={15} />
                  <span>{submitting ? 'Adding...' : 'Add to Waterfall Ranking'}</span>
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* 3. Live Active Lists: Short-Term Evaluated Items & Long-Term Goals */}
      <div className="finai-dashboard-split-row">
        
        {/* Short-Term Evaluated List */}
        <div className="finai-card">
          <div className="finai-card-title-bar" style={{ marginBottom: '0.75rem' }}>
            <h3 className="finai-section-title" style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShoppingBag size={16} color="#8b5cf6" />
              <span>Short-Term Purchases Status</span>
            </h3>
            <span className="badge badge-accepted" style={{ fontSize: '0.7rem' }}>
              {acceptedPurchases.length} Accepted • {deferredPurchases.length} Deferred
            </span>
          </div>

          {purchases.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No short-term purchases requested yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '380px' }}>
              {purchases.map((item: any) => {
                const isAccepted = knapsackResult?.explanations?.[item.id]?.accepted ?? (item.status === 'ACCEPTED');
                return (
                  <div
                    key={item.id}
                    style={{
                      background: isAccepted ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                      border: `1px solid ${isAccepted ? 'var(--accent-green-border)' : 'var(--accent-red-border)'}`,
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.item_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        ₹{item.amount.toLocaleString()} • {item.category} • Priority {item.priority_weight}/10
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className={`badge ${isAccepted ? 'badge-accepted' : 'badge-bearish'}`} style={{ fontSize: '0.68rem' }}>
                        {isAccepted ? 'Accepted' : 'Deferred'}
                      </span>
                      <button
                        className="finai-circle-btn"
                        style={{ width: '26px', height: '26px', color: 'var(--accent-red)' }}
                        onClick={() => handleDeletePurchase(item.id)}
                        title="Delete Item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Long-Term Goals Evaluated List */}
        <div className="finai-card">
          <div className="finai-card-title-bar" style={{ marginBottom: '0.75rem' }}>
            <h3 className="finai-section-title" style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Target size={16} color="var(--accent-green)" />
              <span>Long-Term Goals Waterfall</span>
            </h3>
            <span className="badge badge-accepted" style={{ fontSize: '0.7rem' }}>
              {investBudget > 0 ? `₹${investBudget.toLocaleString()}/mo Active SIP` : 'No Pool'}
            </span>
          </div>

          {rankedGoals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No long-term goals registered yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '380px' }}>
              {rankedGoals.map((goal: any, index: number) => (
                <div
                  key={goal.id}
                  style={{
                    background: 'var(--card-bg-subtle)',
                    border: '1px solid var(--card-border)',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--sidebar-active-bg)' : 'var(--card-border)',
                          color: index === 0 ? '#4ade80' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.7rem'
                        }}
                      >
                        #{goal.priority_rank}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{goal.description}</span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Target: ₹{goal.target_amount.toLocaleString()} in {goal.horizon_years}y • Allocated: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{goal.allocated_invest_amount?.toLocaleString()}/mo</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      className="finai-circle-btn"
                      style={{ width: '26px', height: '26px' }}
                      onClick={() => setEditingGoal(goal)}
                      title="Edit Goal"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      className="finai-circle-btn"
                      style={{ width: '26px', height: '26px', color: 'var(--accent-red)' }}
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete Goal"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. 5-Year Compound Projection Chart */}
      {(activeTab === 'all' || activeTab === 'chart') && (
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--accent-green)" />
            <span>5-Year Compounding Wealth Trajectory Across All Goals</span>
          </h3>
          <GoalProjectionChart data={projectionData} />
        </div>
      )}

      {/* Goal Edit Modal */}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSuccess={() => {
            loadGoals();
            onRefreshParent();
          }}
        />
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <EditBudgetModal
          planId={plan.id}
          totalIncome={totalIncome}
          currentSpend={spendBudget}
          currentInvest={investBudget}
          currentDiscretionary={discretionaryCap}
          currentSave={Number(plan.save_budget || 0)}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={onRefreshParent}
        />
      )}

      {/* Master Recalibrate Modal */}
      {showRecalibrateModal && planData?.family && (
        <MasterRecalibrateModal
          family={planData.family}
          plan={plan}
          onClose={() => setShowRecalibrateModal(false)}
          onSuccess={() => {
            loadGoals();
            onRefreshParent();
          }}
        />
      )}

    </div>
  );
};
