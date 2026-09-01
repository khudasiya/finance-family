import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, RefreshCw, Sliders } from 'lucide-react';
import { Goal, updateGoal } from '../services/api';

interface EditGoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [horizonYears, setHorizonYears] = useState('');
  const [userImportance, setUserImportance] = useState(8);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [customAllocation, setCustomAllocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setDescription(goal.description);
      setTargetAmount(String(goal.target_amount));
      setHorizonYears(String(goal.horizon_years));
      setUserImportance(goal.user_importance);
      setStatus(goal.status || 'IN_PROGRESS');
      setCustomAllocation(
        goal.custom_allocated_amount !== null && goal.custom_allocated_amount !== undefined
          ? String(goal.custom_allocated_amount)
          : ''
      );
    }
  }, [goal]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !targetAmount || Number(targetAmount) <= 0 || Number(horizonYears) <= 0) return;

    setSubmitting(true);
    try {
      await updateGoal(goal.id, {
        description,
        target_amount: Number(targetAmount),
        horizon_years: Number(horizonYears),
        user_importance: Number(userImportance),
        status,
        custom_allocated_amount: customAllocation.trim() !== '' ? Number(customAllocation) : null
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAutoWaterfall = async () => {
    setSubmitting(true);
    try {
      await updateGoal(goal.id, {
        reset_custom_allocation: true
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to reset goal allocation');
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
          <Edit3 size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Household Goal & Allocation</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal Description</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horizon (Years)</label>
              <input
                type="number"
                className="form-input"
                step="0.5"
                min="0.5"
                max="10"
                value={horizonYears}
                onChange={e => setHorizonYears(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Manual Investment Override Input Field */}
          <div className="form-group" style={{ background: 'var(--input-bg)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ⚡ Manual Monthly Allocation Override (₹/mo)
              </label>
              {goal.is_custom_allocated && (
                <button
                  type="button"
                  onClick={handleResetAutoWaterfall}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <RefreshCw size={12} />
                  <span>Reset to Auto Waterfall</span>
                </button>
              )}
            </div>
            <input
              type="number"
              className="form-input"
              placeholder="Leave blank for auto priority waterfall"
              min="0"
              value={customAllocation}
              onChange={e => setCustomAllocation(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.4' }}>
              Manually reserving an investment amount for this goal automatically recalibrates remaining investment funds across all other goals!
            </p>
          </div>

          <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Importance (1-10)</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{userImportance} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={userImportance}
                onChange={e => setUserImportance(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.3rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Goal Status</label>
              <select
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-emerald" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Saving...' : 'Save & Recalibrate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
