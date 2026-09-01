import React, { useState } from 'react';
import { X, Check, RefreshCw, Sliders, TrendingUp, Shield, ShoppingBag } from 'lucide-react';
import { updatePlanBudget } from '../services/api';

interface EditBudgetModalProps {
  planId: number;
  totalIncome: number;
  currentSpend: number;
  currentInvest: number;
  currentDiscretionary: number;
  currentSave: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  planId,
  totalIncome,
  currentSpend,
  currentInvest,
  currentDiscretionary,
  currentSave,
  onClose,
  onSuccess
}) => {
  const [spend, setSpend] = useState(String(currentSpend));
  const [invest, setInvest] = useState(String(currentInvest));
  const [discretionary, setDiscretionary] = useState(String(currentDiscretionary));
  const [submitting, setSubmitting] = useState(false);

  const numSpend = Number(spend) || 0;
  const numInvest = Number(invest) || 0;
  const numDiscretionary = Number(discretionary) || 0;

  // Real-time balancing figure equation: Income - Essentials - Investments - Discretionary
  const computedSave = Math.max(0, totalIncome - numSpend - numInvest - numDiscretionary);
  const isOverAllocated = (numSpend + numInvest + numDiscretionary) > totalIncome;
  const overAllocatedAmount = (numSpend + numInvest + numDiscretionary) - totalIncome;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverAllocated) {
      alert(`Total budget allocations (₹${(numSpend + numInvest + numDiscretionary).toLocaleString()}) exceed total income (₹${totalIncome.toLocaleString()}) by ₹${overAllocatedAmount.toLocaleString()}. Please adjust amounts.`);
      return;
    }

    setSubmitting(true);
    try {
      await updatePlanBudget(planId, {
        spend_budget: numSpend,
        invest_budget: numInvest,
        discretionary_budget: numDiscretionary
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update budget allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetDefaults = async () => {
    setSubmitting(true);
    try {
      await updatePlanBudget(planId, { reset_defaults: true });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to reset budget allocation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Sliders size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Custom Household Budget Allocations</h3>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Total Household Income: <strong style={{ color: 'var(--text-primary)' }}>₹{totalIncome.toLocaleString()}/mo</strong>.
          Adjust Essentials or Market Investments to see real-time rebalancing of your Cash Savings pool.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Essentials Spend */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} color="var(--accent-cyan)" />
              <span>Essentials Needs Budget (₹)</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="0"
              max={totalIncome}
              step="500"
              value={spend}
              onChange={e => setSpend(e.target.value)}
              required
            />
          </div>

          {/* Market Investment */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} color="var(--accent-emerald)" />
              <span>Market Investment Allocation (₹)</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="0"
              max={totalIncome}
              step="500"
              value={invest}
              onChange={e => setInvest(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Directly funds your priority-ranked long-term household goals.
            </p>
          </div>

          {/* Discretionary Short-Term Cap */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShoppingBag size={16} color="var(--accent-primary)" />
              <span>Short-Term Discretionary Spend Cap (₹)</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="0"
              max={totalIncome}
              step="500"
              value={discretionary}
              onChange={e => setDiscretionary(e.target.value)}
              required
            />
          </div>

          {/* Real-time calculated Cash Savings Result */}
          <div
            style={{
              background: isOverAllocated ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
              border: `1px solid ${isOverAllocated ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
              padding: '0.9rem 1rem',
              borderRadius: '8px',
              marginTop: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Rebalanced Cash Savings Reserve:
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isOverAllocated ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                ₹{computedSave.toLocaleString()}/mo
              </span>
            </div>

            {isOverAllocated && (
              <p style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', marginTop: '0.4rem', fontWeight: 600 }}>
                ⚠️ Allocations exceed total monthly income by ₹{overAllocatedAmount.toLocaleString()}.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={handleResetDefaults}
              disabled={submitting}
            >
              <RefreshCw size={14} />
              <span>Reset to Auto Split</span>
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-emerald" disabled={submitting || isOverAllocated}>
                <Check size={16} />
                <span>{submitting ? 'Saving...' : 'Save & Rebalance'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
