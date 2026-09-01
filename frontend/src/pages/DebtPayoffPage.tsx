import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, ShieldAlert, ArrowDownUp, Zap } from 'lucide-react';
import { fetchDebts, addDebt, deleteDebt } from '../services/api';

interface DebtPayoffPageProps {
  familyId: number;
  onRefreshParent?: () => void;
}

export const DebtPayoffPage: React.FC<DebtPayoffPageProps> = ({ familyId, onRefreshParent }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  // Form states
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [debtType, setDebtType] = useState('Personal Loan');
  const [submitting, setSubmitting] = useState(false);

  const loadDebtData = async () => {
    setLoading(true);
    try {
      const res = await fetchDebts(familyId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Failed to load debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadDebtData();
    }
  }, [familyId]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !principal || Number(principal) < 0) return;

    setSubmitting(true);
    try {
      await addDebt({
        family_id: familyId,
        name,
        principal_amount: Number(principal),
        interest_rate: Number(interestRate || 0),
        minimum_payment: Number(minPayment || 0),
        debt_type: debtType
      });
      setName('');
      setPrincipal('');
      setInterestRate('');
      setMinPayment('');
      loadDebtData();
    } catch (err: any) {
      alert(err.message || 'Failed to add debt record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDebt(id);
      loadDebtData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete debt record');
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Calculating Debt Snowball & Avalanche strategies...</p>
      </div>
    );
  }

  const debts = data.debts || [];
  const totals = data.totals || { totalPrincipal: 0, totalMinMonthlyPayment: 0, dtiRatio: 0, dtiStatus: 'HEALTHY' };
  const sortedDebts = strategy === 'snowball' ? data.strategies?.snowball || debts : data.strategies?.avalanche || debts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Page Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CreditCard size={22} color="var(--accent-green)" />
              <span>Debt & Loan Payoff Strategy Engine</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Simulates Debt Avalanche (mathematically optimal) vs. Debt Snowball (behavioral momentum).
            </p>
          </div>

          <div className="finai-tab-pill-group">
            <button
              onClick={() => setStrategy('avalanche')}
              className={`finai-tab-pill-btn ${strategy === 'avalanche' ? 'active' : ''}`}
            >
              Avalanche (Highest Interest %)
            </button>
            <button
              onClick={() => setStrategy('snowball')}
              className={`finai-tab-pill-btn ${strategy === 'snowball' ? 'active' : ''}`}
            >
              Snowball (Lowest Balance First)
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Total Principal Debt: <strong style={{ color: 'var(--accent-red)' }}>₹{totals.totalPrincipal.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Min Monthly EMIs: <strong>₹{totals.totalMinMonthlyPayment.toLocaleString()}/mo</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Debt-to-Income (DTI): <strong style={{ color: totals.dtiStatus === 'HEALTHY' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{totals.dtiRatio}% ({totals.dtiStatus})</strong>
          </div>
        </div>
      </div>

      {/* 2. Dual Form & Strategies Grid */}
      <div className="finai-dashboard-split-row">
        
        {/* Left: Add Debt Form */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>Add Loan / Debt Record</span>
          </h3>

          <form onSubmit={handleAddDebt}>
            <div className="form-group">
              <label className="form-label">Debt / Loan Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC Home Loan / Credit Card"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Principal Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="250000"
                  min="0"
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="12.5"
                  min="0"
                  value={interestRate}
                  onChange={e => setInterestRate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Min Monthly EMI (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="5000"
                  min="0"
                  value={minPayment}
                  onChange={e => setMinPayment(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Debt Type</label>
                <select
                  className="form-input"
                  value={debtType}
                  onChange={e => setDebtType(e.target.value)}
                >
                  <option value="Home Loan">Home Loan</option>
                  <option value="Auto Loan">Auto Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Education Loan">Education Loan</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Adding...' : 'Add to Payoff Optimizer'}</span>
            </button>
          </form>
        </div>

        {/* Right: Payoff Queue */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownUp size={16} color="var(--accent-green)" />
            <span>Target Payoff Sequence ({strategy.toUpperCase()})</span>
          </h3>

          {sortedDebts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No debt records added. Your household is completely debt-free!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '420px' }}>
              {sortedDebts.map((debt: any, index: number) => (
                <div
                  key={debt.id}
                  style={{
                    background: index === 0 ? 'var(--accent-green-light)' : 'var(--card-bg-subtle)',
                    border: `1px solid ${index === 0 ? 'var(--accent-green-border)' : 'var(--card-border)'}`,
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--sidebar-active-bg)' : 'var(--card-border)',
                          color: index === 0 ? '#4ade80' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}
                      >
                        #{index + 1}
                      </span>
                      <strong style={{ fontSize: '0.9rem' }}>{debt.name}</strong>
                      {index === 0 && <span className="badge badge-accepted" style={{ fontSize: '0.68rem' }}>Target First</span>}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Balance: <strong style={{ color: 'var(--accent-red)' }}>₹{debt.principal_amount.toLocaleString()}</strong> • 
                      Rate: <strong>{debt.interest_rate}%</strong> • 
                      Min EMI: <strong>₹{debt.minimum_payment.toLocaleString()}/mo</strong>
                    </div>
                  </div>

                  <button
                    className="finai-circle-btn"
                    style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                    onClick={() => handleDelete(debt.id)}
                    title="Delete Debt"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
