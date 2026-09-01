import React, { useState } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { createFamily, Family } from '../services/api';

interface OnboardingProps {
  onSuccess: (fam: Family) => void;
  onClose?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onSuccess, onClose }) => {
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !income || Number(income) <= 0) return;

    setSubmitting(true);
    try {
      const fam = await createFamily(name, Number(income));
      onSuccess(fam);
    } catch (err: any) {
      alert(err.message || 'Failed to create family profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem'
      }}
    >
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', position: 'relative' }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Users size={28} color="#6366f1" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create Household Profile</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            Setup a shared family unit with combined monthly income to activate market-aware optimization planning.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Household Family Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sharma Household"
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
              placeholder="150000"
              min="1"
              value={income}
              onChange={e => setIncome(e.target.value)}
              required
            />
          </div>

          <div className="explain-box" style={{ marginBottom: '1.25rem' }}>
            <strong>Automatic Split Engine Baseline:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', fontSize: '0.82rem' }}>
              <li>Essentials Needs: 45%</li>
              <li>Savings & Buffer: 25% (Market adjusted)</li>
              <li>Investments Pool: 20% (Market adjusted)</li>
              <li>Discretionary Knapsack: 10%</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem' }}
            disabled={submitting}
          >
            <Plus size={18} />
            <span>{submitting ? 'Creating Household...' : 'Initialize Household Planning'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
