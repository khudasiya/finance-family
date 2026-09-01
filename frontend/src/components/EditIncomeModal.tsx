import React, { useState } from 'react';
import { X, DollarSign, Check, Building } from 'lucide-react';
import { updateFamily, Family } from '../services/api';

interface EditIncomeModalProps {
  family: Family;
  onClose: () => void;
  onSuccess: (updatedFamily: Family) => void;
}

export const EditIncomeModal: React.FC<EditIncomeModalProps> = ({ family, onClose, onSuccess }) => {
  const [name, setName] = useState(family.name);
  const [income, setIncome] = useState(String(family.total_monthly_income));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!income || Number(income) <= 0) return;

    setSubmitting(true);
    try {
      const updated = await updateFamily(family.id, name, Number(income));
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update monthly income');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
          <DollarSign size={22} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Update Household Income & Details</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Household Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Monthly Household Income (₹)</label>
            <input
              type="number"
              className="form-input"
              min="1000"
              step="500"
              value={income}
              onChange={e => setIncome(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Updating income automatically recalculates your Essentials (45%), Cash Savings (25%), Investments (20%), and Discretionary budget pools in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-emerald" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Updating...' : 'Save Income & Recalculate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
