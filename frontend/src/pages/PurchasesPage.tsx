import React, { useState } from 'react';
import { ShoppingBag, Plus, CheckCircle2, XCircle, Trash2, Sliders, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { addPurchase, deletePurchase, updatePlanBudget } from '../services/api';
import { EditBudgetModal } from '../components/EditBudgetModal';

interface PurchasesPageProps {
  planData: any;
  onRefresh: () => void;
}

export const PurchasesPage: React.FC<PurchasesPageProps> = ({ planData, onRefresh }) => {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [priorityWeight, setPriorityWeight] = useState(8);
  const [budgetType, setBudgetType] = useState<'DISCRETIONARY' | 'ESSENTIAL'>('DISCRETIONARY');
  const [submitting, setSubmitting] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  if (!planData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading short-term purchase optimizer...</p>
      </div>
    );
  }

  const { plan, family, knapsackResult } = planData;
  const purchases = planData.purchases || [];
  const discretionaryCap = Number(plan.discretionary_budget);
  const spendBudget = Number(plan.spend_budget);
  const saveBudget = Number(plan.save_budget);
  const investBudget = Number(plan.invest_budget);
  const totalIncome = Number(family.total_monthly_income);

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await addPurchase({
        plan_id: plan.id,
        item_name: itemName,
        amount: Number(amount),
        category,
        priority_weight: Number(priorityWeight),
        budget_type: budgetType
      });
      setItemName('');
      setAmount('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add purchase request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePurchase(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase item');
    }
  };

  // One-click quick reallocate to accept a deferred item
  const handleQuickReallocate = async (itemAmount: number) => {
    try {
      const neededDiscretionary = Math.ceil(itemAmount + (knapsackResult?.totalCost || 0));
      const currentDiscretionary = Number(plan.discretionary_budget);
      const diff = Math.max(0, neededDiscretionary - currentDiscretionary);

      if (diff === 0) {
        onRefresh();
        return;
      }

      const newSpend = Math.max(0, spendBudget - diff);
      const newDiscretionary = currentDiscretionary + diff;

      await updatePlanBudget(plan.id, {
        spend_budget: newSpend,
        discretionary_budget: newDiscretionary
      });

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reallocate budget');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShoppingBag size={22} color="var(--accent-green)" />
              <span>Purchase Optimizer (0/1 Knapsack AI)</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Dynamically evaluates monthly short-term purchases to maximize satisfaction within your discretionary cap.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setShowBudgetModal(true)}
            style={{ fontSize: '0.82rem' }}
          >
            <Sliders size={14} />
            <span>Edit Budget Caps</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Discretionary Cap: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{discretionaryCap.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Essentials Budget: <strong>₹{spendBudget.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Optimizer Accepted Total: <strong style={{ color: 'var(--accent-green)' }}>₹{(knapsackResult?.totalCost || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* 2. Dual Form & Live Decision Grid */}
      <div className="finai-dashboard-split-row">
        {/* Form to Request Purchase */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>Request Monthly Purchase</span>
          </h3>

          <form onSubmit={handleAddPurchase}>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Work Laptop / Refrigerator"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Cost / Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="15000"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {/* Budget Category Selection: Discretionary Want vs Essential Need */}
            <div className="form-group">
              <label className="form-label">Budget Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setBudgetType('DISCRETIONARY')}
                  className="finai-action-btn"
                  style={{
                    padding: '0.65rem 0.75rem',
                    border: `1.5px solid ${budgetType === 'DISCRETIONARY' ? 'var(--accent-green)' : 'var(--card-border)'}`,
                    background: budgetType === 'DISCRETIONARY' ? 'var(--accent-green-light)' : 'var(--card-bg-subtle)',
                    color: budgetType === 'DISCRETIONARY' ? 'var(--accent-green-hover)' : 'var(--text-secondary)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>🛒 Discretionary Want</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Evaluates vs ₹{discretionaryCap.toLocaleString()}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBudgetType('ESSENTIAL')}
                  className="finai-action-btn"
                  style={{
                    padding: '0.65rem 0.75rem',
                    border: `1.5px solid ${budgetType === 'ESSENTIAL' ? 'var(--accent-green)' : 'var(--card-border)'}`,
                    background: budgetType === 'ESSENTIAL' ? 'var(--accent-green-light)' : 'var(--card-bg-subtle)',
                    color: budgetType === 'ESSENTIAL' ? 'var(--accent-green-hover)' : 'var(--text-secondary)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>🏥 Essential Living Need</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Funded from Essentials</div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Priority Weight (1 to 10 scale)</label>
                <span style={{ fontWeight: 800, color: 'var(--accent-green-hover)' }}>{priorityWeight} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={priorityWeight}
                onChange={e => setPriorityWeight(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-green)', cursor: 'pointer', marginTop: '0.35rem', width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Adding...' : 'Add Purchase Request'}</span>
            </button>
          </form>
        </div>

        {/* Accepted vs Deferred Live Cards with Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Accepted Purchases Card */}
          <div className="finai-card">
            <h3 className="finai-section-title" style={{ fontSize: '0.98rem', color: 'var(--accent-green-hover)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={18} />
              <span>Accepted Purchases ({knapsackResult?.accepted?.length || 0})</span>
            </h3>

            {knapsackResult?.accepted?.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.65rem', fontStyle: 'italic' }}>
                No purchases currently accepted into monthly budget.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                {knapsackResult?.accepted?.map((item: any) => {
                  const explanation = knapsackResult?.explanations?.[item.id]?.reason;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--accent-green-light)',
                        border: '1px solid var(--accent-green-border)',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.item_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            ₹{item.amount.toLocaleString()} • {item.category} • Priority: <strong>{item.priority_weight}/10</strong>
                            {item.budget_type === 'ESSENTIAL' && <span style={{ color: 'var(--accent-green-hover)', marginLeft: '0.4rem', fontWeight: 700 }}>[Essential Need]</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-accepted">Accepted</span>
                          <button
                            className="finai-circle-btn"
                            style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                            onClick={() => handleDelete(item.id)}
                            title="Delete Purchase"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {explanation && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--accent-green-hover)', marginTop: '0.4rem', borderTop: '1px dashed var(--accent-green-border)', paddingTop: '0.35rem' }}>
                          💡 {explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deferred Purchases Card */}
          <div className="finai-card">
            <h3 className="finai-section-title" style={{ fontSize: '0.98rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <XCircle size={18} />
              <span>Deferred Purchases ({knapsackResult?.deferred?.length || 0})</span>
            </h3>

            {knapsackResult?.deferred?.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.65rem', fontStyle: 'italic' }}>
                No deferred purchases. All requested items fit within budget!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                {knapsackResult?.deferred?.map((item: any) => {
                  const explanation = knapsackResult?.explanations?.[item.id]?.reason;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--accent-red-light)',
                        border: '1px solid var(--accent-red-border)',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.item_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            ₹{item.amount.toLocaleString()} • {item.category} • Priority: {item.priority_weight}/10
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-bearish">Deferred</span>
                          <button
                            className="finai-circle-btn"
                            style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                            onClick={() => handleDelete(item.id)}
                            title="Delete Purchase"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {explanation && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--accent-red)', marginTop: '0.4rem', borderTop: '1px dashed var(--accent-red-border)', paddingTop: '0.35rem' }}>
                          ⚠️ {explanation}
                        </div>
                      )}

                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          className="finai-ai-prompt-chip"
                          onClick={() => handleQuickReallocate(item.amount)}
                        >
                          ⚡ Reallocate Budget to Fund This Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Detailed Items Table */}
      <div className="finai-card">
        <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={18} color="var(--accent-green)" />
          <span>All Requested Items & Algorithmic Explanations</span>
        </h3>

        {purchases.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic' }}>No purchase requests added yet.</p>
        ) : (
          <div className="finai-table-container">
            <table className="finai-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Cost (₹)</th>
                  <th>Category</th>
                  <th>Budget Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Algorithmic Explanation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((item: any) => {
                  const exp = knapsackResult?.explanations?.[item.id];
                  const isAccepted = exp?.accepted ?? (item.status === 'ACCEPTED');
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green-hover)' }}>₹{item.amount.toLocaleString()}</td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`badge ${item.budget_type === 'ESSENTIAL' ? 'badge-accepted' : 'badge-neutral'}`}>
                          {item.budget_type === 'ESSENTIAL' ? 'Essential' : 'Discretionary'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.priority_weight}/10</td>
                      <td>
                        <span className={`badge ${isAccepted ? 'badge-accepted' : 'badge-bearish'}`}>
                          {isAccepted ? 'Accepted' : 'Deferred'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: isAccepted ? 'var(--text-secondary)' : 'var(--accent-red)', maxWidth: '300px' }}>
                        {exp?.reason || item.decision_reason || 'Evaluated by 0/1 Knapsack optimization.'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="finai-circle-btn"
                          style={{ width: '28px', height: '28px', color: 'var(--accent-red)', marginLeft: 'auto' }}
                          onClick={() => handleDelete(item.id)}
                          title="Delete Purchase"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Budget Modal */}
      {showBudgetModal && (
        <EditBudgetModal
          planId={plan.id}
          totalIncome={totalIncome}
          currentSpend={spendBudget}
          currentInvest={investBudget}
          currentDiscretionary={discretionaryCap}
          currentSave={saveBudget}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
