import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, Save, ArrowRight, Shield, ShoppingBag, Target, PiggyBank } from 'lucide-react';
import { Family, updateFamily, updatePlanBudget } from '../services/api';

interface MasterRecalibrateModalProps {
  family: Family;
  plan: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterRecalibrateModal: React.FC<MasterRecalibrateModalProps> = ({
  family,
  plan,
  onClose,
  onSuccess
}) => {
  const currentIncome = Number(family.total_monthly_income || 1500000);
  const [income, setIncome] = useState(String(currentIncome));

  // Current values
  const [spendAmount, setSpendAmount] = useState<number>(Number(plan?.spend_budget || currentIncome * 0.45));
  const [discretionaryAmount, setDiscretionaryAmount] = useState<number>(Number(plan?.discretionary_budget || currentIncome * 0.10));
  const [investAmount, setInvestAmount] = useState<number>(Number(plan?.invest_budget || currentIncome * 0.25));
  const [saveAmount, setSaveAmount] = useState<number>(Number(plan?.save_budget || currentIncome * 0.20));

  const [submitting, setSubmitting] = useState(false);

  const numIncome = Math.max(1, Number(income || 0));
  const totalAllocated = spendAmount + discretionaryAmount + investAmount + saveAmount;
  const diff = numIncome - totalAllocated;
  const isBalanced = Math.abs(diff) < 1;

  // Percentage calculations
  const spendPct = Math.round((spendAmount / numIncome) * 100);
  const discretionaryPct = Math.round((discretionaryAmount / numIncome) * 100);
  const investPct = Math.round((investAmount / numIncome) * 100);
  const savePct = Math.round((saveAmount / numIncome) * 100);

  // When income changes, scale components proportionally
  const handleIncomeChange = (newIncStr: string) => {
    setIncome(newIncStr);
    const newInc = Math.max(1, Number(newIncStr || 0));
    if (newInc > 0 && currentIncome > 0) {
      const ratio = newInc / currentIncome;
      setSpendAmount(Math.round(spendAmount * ratio));
      setDiscretionaryAmount(Math.round(discretionaryAmount * ratio));
      setInvestAmount(Math.round(investAmount * ratio));
      setSaveAmount(Math.round(saveAmount * ratio));
    }
  };

  // Preset Handlers
  const applyPreset = (needsRatio: number, wantsRatio: number, goalsRatio: number, savingsRatio: number) => {
    setSpendAmount(Math.round(numIncome * needsRatio));
    setDiscretionaryAmount(Math.round(numIncome * wantsRatio));
    setInvestAmount(Math.round(numIncome * goalsRatio));
    setSaveAmount(Math.round(numIncome * savingsRatio));
  };

  const handleAutoBalance = () => {
    // Distribute diff into savings
    setSaveAmount(Math.max(0, saveAmount + diff));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Update family income if changed
      if (numIncome !== currentIncome) {
        await updateFamily(family.id, family.name, numIncome, family.avatar_url);
      }

      // 2. Update plan allocations
      await updatePlanBudget(plan.id, {
        spend_budget: spendAmount,
        invest_budget: investAmount,
        discretionary_budget: discretionaryAmount
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update and recalibrate plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={22} color="var(--accent-green)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Master Financial Balancer & Recalibrator</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customize and calibrate your household budget allocations in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* 1. Income Input */}
          <div style={{ background: 'var(--card-bg-subtle)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Total Monthly Household Net Income</label>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-green-hover)', fontWeight: 700 }}>Total Pool: ₹{numIncome.toLocaleString()}</span>
            </div>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: 800, padding: '0.65rem 0.9rem' }}
              value={income}
              onChange={e => handleIncomeChange(e.target.value)}
              placeholder="1500000"
              min="1000"
              required
            />
          </div>

          {/* Preset Strategy Buttons */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              ⚡ Quick Balancing Strategies
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => applyPreset(0.50, 0.10, 0.20, 0.20)}
              >
                50/30/20 Rule
              </button>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => applyPreset(0.40, 0.10, 0.35, 0.15)}
              >
                Aggressive Wealth Builder (35% Goals)
              </button>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => applyPreset(0.45, 0.05, 0.20, 0.30)}
              >
                Conservative Emergency Buffer (30% Cash)
              </button>
            </div>
          </div>

          {/* Real-Time Balance Status Meter */}
          <div style={{ background: isBalanced ? 'var(--accent-green-light)' : 'var(--accent-red-light)', border: `1px solid ${isBalanced ? 'var(--accent-green-border)' : 'var(--accent-red-border)'}`, padding: '0.85rem 1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.85rem', color: isBalanced ? 'var(--accent-green-hover)' : 'var(--accent-red)' }}>
                {isBalanced ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{isBalanced ? '100% Balanced Allocation' : diff > 0 ? `₹${diff.toLocaleString()} Unallocated Surplus` : `₹${Math.abs(diff).toLocaleString()} Over-Allocated`}</span>
              </div>
              {!isBalanced && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="finai-tab-pill-btn active"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                >
                  Auto-Balance to Cash Savings
                </button>
              )}
            </div>

            {/* Visual Multi-Segment Bar */}
            <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginTop: '0.6rem' }}>
              <div style={{ width: `${spendPct}%`, background: '#06b6d4' }} title={`Essentials: ${spendPct}%`} />
              <div style={{ width: `${discretionaryPct}%`, background: '#8b5cf6' }} title={`Wants: ${discretionaryPct}%`} />
              <div style={{ width: `${investPct}%`, background: '#22c55e' }} title={`Goals: ${investPct}%`} />
              <div style={{ width: `${savePct}%`, background: '#f59e0b' }} title={`Savings: ${savePct}%`} />
            </div>
          </div>

          {/* Allocation Categories Sliders & Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* 1. Essentials Needs */}
            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Shield size={16} color="#06b6d4" />
                  <strong style={{ fontSize: '0.85rem' }}>Essential Living Expenses (Needs)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 700 }}>{spendPct}%</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', fontWeight: 700 }}
                    value={spendAmount}
                    onChange={e => setSpendAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={numIncome}
                step="1000"
                value={spendAmount}
                onChange={e => setSpendAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
              />
            </div>

            {/* 2. Short-Term Wants (Discretionary Cap) */}
            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShoppingBag size={16} color="#8b5cf6" />
                  <strong style={{ fontSize: '0.85rem' }}>Short-Term Purchases Cap (Wants / 0/1 Knapsack)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 700 }}>{discretionaryPct}%</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', fontWeight: 700 }}
                    value={discretionaryAmount}
                    onChange={e => setDiscretionaryAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={numIncome}
                step="1000"
                value={discretionaryAmount}
                onChange={e => setDiscretionaryAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
            </div>

            {/* 3. Long-Term Goals Investment */}
            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Target size={16} color="var(--accent-green)" />
                  <strong style={{ fontSize: '0.85rem' }}>Long-Term Goals Investment Pool</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-green-hover)', fontWeight: 700 }}>{investPct}%</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', fontWeight: 700 }}
                    value={investAmount}
                    onChange={e => setInvestAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={numIncome}
                step="1000"
                value={investAmount}
                onChange={e => setInvestAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
              />
            </div>

            {/* 4. Cash Savings Reserve */}
            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <PiggyBank size={16} color="#f59e0b" />
                  <strong style={{ fontSize: '0.85rem' }}>Cash Savings & Liquid Emergency Reserve</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>{savePct}%</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', fontWeight: 700 }}
                    value={saveAmount}
                    onChange={e => setSaveAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={numIncome}
                step="1000"
                value={saveAmount}
                onChange={e => setSaveAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={15} />
              <span>{submitting ? 'Recalibrating Plan...' : 'Apply & Recalibrate Everything'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
