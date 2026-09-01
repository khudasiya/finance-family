import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, Clock, Bell } from 'lucide-react';
import { fetchBills, addBill, toggleBillPaid, deleteBill } from '../services/api';

interface BillsPageProps {
  familyId: number;
  onRefreshParent?: () => void;
}

export const BillsPage: React.FC<BillsPageProps> = ({ familyId, onRefreshParent }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [category, setCategory] = useState('Utility');
  const [submitting, setSubmitting] = useState(false);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await fetchBills(familyId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadBills();
    }
  }, [familyId]);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await addBill({
        family_id: familyId,
        name,
        amount: Number(amount),
        due_day: Number(dueDay),
        category
      });
      setName('');
      setAmount('');
      loadBills();
    } catch (err: any) {
      alert(err.message || 'Failed to add bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePaid = async (id: number) => {
    try {
      await toggleBillPaid(id);
      loadBills();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBill(id);
      loadBills();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bill');
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading monthly recurring bills & subscription manager...</p>
      </div>
    );
  }

  const bills = data.bills || [];
  const totals = data.totals || { totalMonthlyBills: 0, totalAnnualCost: 0, paidCount: 0, unpaidCount: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Top Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={22} color="var(--accent-green)" />
              <span>Recurring Bills & Subscription Checklist</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Track due dates, prevent surprise bank deductions, and mark monthly dues as paid.
            </p>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Monthly Bills Commitment: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{totals.totalMonthlyBills.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Annual Outflow: <strong>₹{totals.totalAnnualCost.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Status: <strong style={{ color: 'var(--accent-green)' }}>{totals.paidCount} Paid</strong> / <strong style={{ color: 'var(--accent-red)' }}>{totals.unpaidCount} Pending</strong>
          </div>
        </div>
      </div>

      {/* 2. Dual Form & Checklist Grid */}
      <div className="finai-dashboard-split-row">
        
        {/* Left: Add Bill Form */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>Add Recurring Bill</span>
          </h3>

          <form onSubmit={handleAddBill}>
            <div className="form-group">
              <label className="form-label">Bill / Subscription Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. WiFi Broadband / Electricity / Netflix"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Monthly Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="1200"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Day of Month</label>
                <select
                  className="form-input"
                  value={dueDay}
                  onChange={e => setDueDay(e.target.value)}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Utility">Utility & Power</option>
                <option value="Internet">Internet & Telecom</option>
                <option value="Subscription">Streaming & Entertainment</option>
                <option value="Insurance">Insurance & Health</option>
                <option value="Rent">Rent & Housing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Adding...' : 'Save Recurring Bill'}</span>
            </button>
          </form>
        </div>

        {/* Right: Bills Checklist */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-green)" />
            <span>Monthly Recurring Dues ({bills.length})</span>
          </h3>

          {bills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No recurring bills registered yet. Use the form to track all upcoming dues!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '420px' }}>
              {bills.map((bill: any) => (
                <div
                  key={bill.id}
                  style={{
                    background: bill.is_paid ? 'var(--accent-green-light)' : 'var(--card-bg-subtle)',
                    border: `1px solid ${bill.is_paid ? 'var(--accent-green-border)' : 'var(--card-border)'}`,
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleTogglePaid(bill.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: bill.is_paid ? 'var(--accent-green-hover)' : 'var(--text-muted)'
                      }}
                      title={bill.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                    >
                      {bill.is_paid ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                    </button>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: bill.is_paid ? 'line-through' : 'none' }}>
                        {bill.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Due on <strong>{bill.due_day}th</strong> • {bill.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: bill.is_paid ? 'var(--accent-green-hover)' : 'var(--text-primary)' }}>
                      ₹{bill.amount.toLocaleString()}
                    </div>

                    <button
                      className="finai-circle-btn"
                      style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                      onClick={() => handleDelete(bill.id)}
                      title="Delete Bill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
