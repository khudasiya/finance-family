import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, Plus, Trash2, Shield, ShoppingBag, PiggyBank, Sparkles, CheckCircle2, ArrowRight, Lock, Target, Gift } from 'lucide-react';
import { fetchSpendingLogs, addSpendingLog, deleteSpendingLog, submitMonthlyAudit } from '../services/api';

interface SpendingPageProps {
  planData: any;
  onRefreshParent?: () => void;
}

export const SpendingPage: React.FC<SpendingPageProps> = ({ planData, onRefreshParent }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Mode: 'SINGLE' (Source Selector) vs 'BATCH' (Weekly/Monthly)
  const [logMode, setLogMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single Expense States
  const [sourceType, setSourceType] = useState<'ESSENTIALS' | 'DISCRETIONARY' | 'SAVINGS'>('ESSENTIALS');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleCategory, setSingleCategory] = useState('Groceries');
  const [singleNotes, setSingleNotes] = useState('');

  // Batch Form States
  const [periodType, setPeriodType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [periodName, setPeriodName] = useState('Week 1');
  const [essentialsSpent, setEssentialsSpent] = useState('');
  const [discretionarySpent, setDiscretionarySpent] = useState('');
  const [savingsAdded, setSavingsAdded] = useState('');
  const [batchNotes, setBatchNotes] = useState('');

  // Month-End Surplus Splitter States
  const [goalSplitAmount, setGoalSplitAmount] = useState<number>(0);
  const [secretLockerSplitAmount, setSecretLockerSplitAmount] = useState<number>(0);
  const [settlingSurplus, setSettlingSurplus] = useState(false);
  const [celebrationAlert, setCelebrationAlert] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const planId = planData?.plan?.id;
  const familyId = planData?.family?.id || 1;

  const loadLogs = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const res = await fetchSpendingLogs(planId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Failed to load spending logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) {
      loadLogs();
    }
  }, [planId]);

  const { plan } = planData || {};
  const plannedEssentials = Number(plan?.spend_budget || 67500);
  const plannedDiscretionary = Number(plan?.discretionary_budget || 15000);

  const logs = data?.logs || [];
  const totals = data?.totals || {
    totalEssentialsSpent: 0,
    totalDiscretionarySpent: 0,
    totalSavingsAdded: 0,
    essentialsRemaining: plannedEssentials,
    discretionaryRemaining: plannedDiscretionary,
    totalUnspentSurplus: plannedEssentials + plannedDiscretionary
  };
  const recommendation = data?.recommendation || '';

  const totalUnspent = Math.max(0, totals.totalUnspentSurplus);

  // Initialize split amounts when unspent surplus loads
  useEffect(() => {
    if (totalUnspent > 0 && goalSplitAmount === 0 && secretLockerSplitAmount === 0) {
      const half = Math.round(totalUnspent / 2);
      setGoalSplitAmount(half);
      setSecretLockerSplitAmount(totalUnspent - half);
    }
  }, [totalUnspent]);

  // Handle Single Expense Submit
  const handleAddSingleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !singleAmount) return;

    setSubmitting(true);
    try {
      const amt = Number(singleAmount);
      await addSpendingLog({
        plan_id: planId,
        period_type: 'SINGLE',
        period_name: singleCategory || (sourceType === 'ESSENTIALS' ? 'Essential Spend' : 'Discretionary Spend'),
        source_type: sourceType,
        amount: amt,
        category: singleCategory,
        notes: singleNotes ? `${singleCategory}: ${singleNotes}` : singleCategory
      });

      setSingleAmount('');
      setSingleNotes('');
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to log spending entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Batch Submit
  const handleAddBatchLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;

    setSubmitting(true);
    try {
      await addSpendingLog({
        plan_id: planId,
        period_type: periodType,
        period_name: periodName,
        essentials_spent: Number(essentialsSpent || 0),
        discretionary_spent: Number(discretionarySpent || 0),
        savings_added: Number(savingsAdded || 0),
        notes: batchNotes
      });

      setEssentialsSpent('');
      setDiscretionarySpent('');
      setSavingsAdded('');
      setBatchNotes('');
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to log spending entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Month-End Surplus Settle
  const handleSettleMonthEndSurplus = async () => {
    if (totalUnspent <= 0) {
      alert('No unspent surplus remaining to distribute.');
      return;
    }

    setSettlingSurplus(true);
    try {
      const auditMonth = new Date().toISOString().slice(0, 7);
      const res = await submitMonthlyAudit({
        family_id: familyId,
        audit_month: auditMonth,
        actual_essentials: totals.totalEssentialsSpent,
        actual_discretionary: totals.totalDiscretionarySpent,
        secret_saving_amount: secretLockerSplitAmount,
        long_term_goal_amount: goalSplitAmount,
        notes: `Month-end settlement: ₹${goalSplitAmount.toLocaleString()} to Long-Term Goals, ₹${secretLockerSplitAmount.toLocaleString()} to Secret Safe Locker.`
      });

      if (res.notification) {
        setCelebrationAlert(res.notification);
      } else {
        alert(`✅ Month-End Surplus Settled!\n• ₹${goalSplitAmount.toLocaleString()} added to Long-Term Goals\n• ₹${secretLockerSplitAmount.toLocaleString()} locked into Secret Safe Locker\n• Safe Locker Balance: ₹${res.safeLockerBalance.toLocaleString()}`);
      }

      loadLogs();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to settle month-end surplus');
    } finally {
      setSettlingSurplus(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSpendingLog(id);
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete spending log entry');
    }
  };

  const setPresetSplit = (ratioGoals: number) => {
    const goals = Math.round(totalUnspent * ratioGoals);
    const secret = totalUnspent - goals;
    setGoalSplitAmount(goals);
    setSecretLockerSplitAmount(secret);
  };

  if (!planData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading actual spending tracker...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Goal Achieved Celebration Banner */}
      {celebrationAlert && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.25))',
          border: '2px solid var(--accent-green)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Gift size={28} color="var(--accent-green)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {celebrationAlert}
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Your accumulated month-end surplus completed your target!
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setCelebrationAlert(null)}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            Awesome! 🚀
          </button>
        </div>
      )}
      
      {/* 1. Top Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Wallet size={22} color="var(--accent-green)" />
              <span>Actual Household Spending & Pool Manager</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Select where you spend from (Essentials vs Discretionary). At month-end (30th/31st), easily split remaining unspent funds between Long-Term Goals and your Secret Safe Locker!
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="finai-tab-pill-group">
            <button
              onClick={() => setLogMode('SINGLE')}
              className={`finai-tab-pill-btn ${logMode === 'SINGLE' ? 'active' : ''}`}
            >
              Single Expense Entry
            </button>

            <button
              onClick={() => setLogMode('BATCH')}
              className={`finai-tab-pill-btn ${logMode === 'BATCH' ? 'active' : ''}`}
            >
              Batch / Weekly Entry
            </button>
          </div>
        </div>

        {/* Smart Guidance Advice */}
        <div style={{ marginTop: '1rem', background: 'var(--card-bg-subtle)', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={18} color="var(--accent-green)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {recommendation ? `💡 ${recommendation}` : '💡 Select your source pool when logging expenses to track live remaining balances!'}
          </div>
        </div>
      </div>

      {/* 2. Top Metric Pool Cards */}
      <div className="finai-stat-grid-3">
        {/* Essentials Needs */}
        <div className="finai-white-card">
          <div className="finai-metric-header">
            <Shield size={16} color="var(--accent-green)" />
            <span>Essentials Needs Pool</span>
          </div>
          <div className="finai-metric-value" style={{ fontSize: '1.45rem' }}>
            ₹{totals.totalEssentialsSpent.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ ₹{plannedEssentials.toLocaleString()}</span>
          </div>
          <div className={`finai-trend-pill ${totals.essentialsRemaining >= 0 ? 'green' : 'red'}`}>
            <span>{totals.essentialsRemaining >= 0 ? `+₹${totals.essentialsRemaining.toLocaleString()} Left in Needs` : `₹${Math.abs(totals.essentialsRemaining).toLocaleString()} Overspent`}</span>
          </div>
        </div>

        {/* Discretionary Spend */}
        <div className="finai-white-card">
          <div className="finai-metric-header">
            <ShoppingBag size={16} color="#8b5cf6" />
            <span>Discretionary Wants Pool</span>
          </div>
          <div className="finai-metric-value" style={{ fontSize: '1.45rem' }}>
            ₹{totals.totalDiscretionarySpent.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ ₹{plannedDiscretionary.toLocaleString()}</span>
          </div>
          <div className={`finai-trend-pill ${totals.discretionaryRemaining >= 0 ? 'green' : 'red'}`}>
            <span>{totals.discretionaryRemaining >= 0 ? `+₹${totals.discretionaryRemaining.toLocaleString()} Left in Wants` : `₹${Math.abs(totals.discretionaryRemaining).toLocaleString()} Overspent`}</span>
          </div>
        </div>

        {/* Total Unspent Living Surplus */}
        <div className="finai-white-card" style={{ border: '1px solid var(--accent-green)' }}>
          <div className="finai-metric-header">
            <PiggyBank size={16} color="var(--accent-green)" />
            <span>Total Month-End Surplus</span>
          </div>
          <div className="finai-metric-value" style={{ fontSize: '1.45rem', color: 'var(--accent-green-hover)' }}>
            ₹{totalUnspent.toLocaleString()}
          </div>
          <div className="finai-trend-pill green">
            <span>Available for Secret Locker & Goals</span>
          </div>
        </div>
      </div>

      {/* 3. Month-End (30th/31st) Surplus Splitter Vault Card */}
      {totalUnspent > 0 && (
        <div className="finai-card" style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--accent-green)',
          padding: '1.35rem 1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3 className="finai-section-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <Lock size={18} color="var(--accent-green)" />
                <span>🗓️ Month-End Surplus Vault (30th / 31st Settle)</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                You have <strong>₹{totalUnspent.toLocaleString()}</strong> unspent surplus left this month! Choose how much goes to <strong>Long-Term Goals</strong> vs <strong>Secret Safe Locker</strong>.
              </p>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => setPresetSplit(1.0)}
                title="100% to Long-Term Goals"
              >
                🎯 100% to Goals
              </button>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => setPresetSplit(0.5)}
                title="50% Goals / 50% Secret Locker"
              >
                ⚖️ 50/50 Split
              </button>
              <button
                type="button"
                className="finai-ai-prompt-chip"
                onClick={() => setPresetSplit(0.0)}
                title="100% to Secret Safe Locker"
              >
                🤫 100% Secret Locker
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem', background: 'var(--card-bg-subtle)', padding: '1.15rem', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
            {/* Goal Share */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Target size={15} color="#8b5cf6" />
                <span>Long-Term Goals Share (₹)</span>
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                max={totalUnspent}
                value={goalSplitAmount}
                onChange={e => {
                  const val = Math.min(totalUnspent, Math.max(0, Number(e.target.value || 0)));
                  setGoalSplitAmount(val);
                  setSecretLockerSplitAmount(totalUnspent - val);
                }}
              />
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Directly accelerates your prioritized long-term goals.
              </p>
            </div>

            {/* Secret Safe Locker Share */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Shield size={15} color="var(--accent-green)" />
                <span>Secret Safe Locker Share (₹)</span>
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                max={totalUnspent}
                value={secretLockerSplitAmount}
                onChange={e => {
                  const val = Math.min(totalUnspent, Math.max(0, Number(e.target.value || 0)));
                  setSecretLockerSplitAmount(val);
                  setGoalSplitAmount(totalUnspent - val);
                }}
              />
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Locked in your private emergency reserve vault.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSettleMonthEndSurplus}
            disabled={settlingSurplus}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontWeight: 700 }}
          >
            <Lock size={16} />
            <span>{settlingSurplus ? 'Settling Surplus...' : `🔒 Settle Month-End Surplus (₹${totalUnspent.toLocaleString()})`}</span>
          </button>
        </div>
      )}

      {/* 4. Form and History Split Grid */}
      <div className="finai-dashboard-split-row">
        
        {/* Left: Form */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>{logMode === 'SINGLE' ? 'Log Expense by Source Pool' : 'Log Batch / Weekly Expenses'}</span>
          </h3>

          {logMode === 'SINGLE' ? (
            /* Mode 1: Single Expense with Source Selector */
            <form onSubmit={handleAddSingleExpense}>
              {/* Pool Selector */}
              <div className="form-group">
                <label className="form-label">Select Source Spending Pool</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('ESSENTIALS');
                      setSingleCategory('Groceries');
                    }}
                    style={{
                      background: sourceType === 'ESSENTIALS' ? 'var(--accent-green-light)' : 'var(--card-bg-subtle)',
                      border: sourceType === 'ESSENTIALS' ? '2px solid var(--accent-green)' : '1px solid var(--card-border)',
                      color: sourceType === 'ESSENTIALS' ? 'var(--accent-green-hover)' : 'var(--text-secondary)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.35rem',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Shield size={16} />
                    <span>Essentials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('DISCRETIONARY');
                      setSingleCategory('Dining Out');
                    }}
                    style={{
                      background: sourceType === 'DISCRETIONARY' ? 'rgba(139, 92, 246, 0.15)' : 'var(--card-bg-subtle)',
                      border: sourceType === 'DISCRETIONARY' ? '2px solid #8b5cf6' : '1px solid var(--card-border)',
                      color: sourceType === 'DISCRETIONARY' ? '#8b5cf6' : 'var(--text-secondary)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.35rem',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>Discretionary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('SAVINGS');
                      setSingleCategory('Cash Deposit');
                    }}
                    style={{
                      background: sourceType === 'SAVINGS' ? 'rgba(234, 179, 8, 0.15)' : 'var(--card-bg-subtle)',
                      border: sourceType === 'SAVINGS' ? '2px solid #eab308' : '1px solid var(--card-border)',
                      color: sourceType === 'SAVINGS' ? '#ca8a04' : 'var(--text-secondary)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.35rem',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <PiggyBank size={16} />
                    <span>Savings</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Expense Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  min="1"
                  value={singleAmount}
                  onChange={e => setSingleAmount(e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category / Purpose</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {sourceType === 'ESSENTIALS' ? (
                    ['Groceries', 'Rent', 'Electricity', 'Medicine', 'Utilities'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className="finai-ai-prompt-chip"
                        onClick={() => setSingleCategory(cat)}
                        style={{
                          background: singleCategory === cat ? 'var(--accent-green-light)' : undefined,
                          color: singleCategory === cat ? 'var(--accent-green-hover)' : undefined
                        }}
                      >
                        {cat}
                      </button>
                    ))
                  ) : sourceType === 'DISCRETIONARY' ? (
                    ['Dining Out', 'Shopping', 'Electronics', 'Entertainment', 'Travel'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className="finai-ai-prompt-chip"
                        onClick={() => setSingleCategory(cat)}
                        style={{
                          background: singleCategory === cat ? 'rgba(139, 92, 246, 0.15)' : undefined,
                          color: singleCategory === cat ? '#8b5cf6' : undefined
                        }}
                      >
                        {cat}
                      </button>
                    ))
                  ) : (
                    ['Emergency Deposit', 'Cash Reserve', 'Secret Saving'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className="finai-ai-prompt-chip"
                        onClick={() => setSingleCategory(cat)}
                        style={{
                          background: singleCategory === cat ? 'rgba(234, 179, 8, 0.15)' : undefined,
                          color: singleCategory === cat ? '#ca8a04' : undefined
                        }}
                      >
                        {cat}
                      </button>
                    ))
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Or custom category name..."
                  value={singleCategory}
                  onChange={e => setSingleCategory(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Optional Item Details / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Supermarket grocery haul"
                  value={singleNotes}
                  onChange={e => setSingleNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                <Plus size={16} />
                <span>{submitting ? 'Registering...' : `+ Deduct & Log ${sourceType === 'ESSENTIALS' ? 'Essential' : (sourceType === 'DISCRETIONARY' ? 'Discretionary' : 'Savings')} Spend`}</span>
              </button>
            </form>
          ) : (
            /* Mode 2: Batch Weekly/Monthly Form */
            <form onSubmit={handleAddBatchLog}>
              <div className="form-group">
                <label className="form-label">Period Name / Label</label>
                {periodType === 'WEEKLY' ? (
                  <select
                    className="form-input"
                    value={periodName}
                    onChange={e => setPeriodName(e.target.value)}
                  >
                    <option value="Week 1">Week 1 (Days 1-7)</option>
                    <option value="Week 2">Week 2 (Days 8-14)</option>
                    <option value="Week 3">Week 3 (Days 15-21)</option>
                    <option value="Week 4">Week 4 (Days 22-30)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={periodName}
                    onChange={e => setPeriodName(e.target.value)}
                    placeholder="e.g. Month End Summary"
                    required
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Essentials Spent (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 15000"
                    min="0"
                    value={essentialsSpent}
                    onChange={e => setEssentialsSpent(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discretionary Spent (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3000"
                    min="0"
                    value={discretionarySpent}
                    onChange={e => setDiscretionarySpent(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cash Savings Deposited (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5000"
                  min="0"
                  value={savingsAdded}
                  onChange={e => setSavingsAdded(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Itemized Notes / Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Groceries ₹8,000, utilities ₹4,000"
                  value={batchNotes}
                  onChange={e => setBatchNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                <Plus size={16} />
                <span>{submitting ? 'Logging...' : 'Save Actual Spend Entry'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: History */}
        <div className="finai-card">
          <div className="finai-card-title-bar" style={{ marginBottom: '1rem' }}>
            <h3 className="finai-section-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--accent-green)" />
              <span>Logged History ({logs.length})</span>
            </h3>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.86rem' }}>No actual spending logged yet this month.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Select a pool and log your expenses above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '420px' }}>
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--card-bg-subtle)',
                    border: '1px solid var(--card-border)',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>{log.period_name}</span>
                      <span className="badge badge-accepted" style={{ fontSize: '0.68rem' }}>
                        {log.period_type}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {log.essentials_spent > 0 && <span>Needs: <strong>₹{log.essentials_spent.toLocaleString()}</strong> </span>}
                      {log.discretionary_spent > 0 && <span>• Wants: <strong>₹{log.discretionary_spent.toLocaleString()}</strong> </span>}
                      {log.savings_added > 0 && <span>• Saved: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{log.savings_added.toLocaleString()}</strong></span>}
                    </div>

                    {log.notes && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        "{log.notes}"
                      </div>
                    )}
                  </div>

                  <button
                    className="finai-circle-btn"
                    style={{ width: '30px', height: '30px', color: 'var(--accent-red)' }}
                    onClick={() => handleDelete(log.id)}
                    title="Delete Entry"
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
