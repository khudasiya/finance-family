import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit3, Award, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { Goal, fetchGoalsData, addGoal, deleteGoal } from '../services/api';
import { GoalProjectionChart } from '../components/GoalProjectionChart';
import { EditGoalModal } from '../components/EditGoalModal';

interface GoalsPageProps {
  familyId: number;
  onRefreshParent?: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ familyId, onRefreshParent }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [horizonYears, setHorizonYears] = useState('3.0');
  const [userImportance, setUserImportance] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetchGoalsData(familyId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
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

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !targetAmount || Number(targetAmount) <= 0 || Number(horizonYears) <= 0) return;

    setSubmitting(true);
    try {
      await addGoal({
        family_id: familyId,
        description,
        target_amount: Number(targetAmount),
        horizon_years: Number(horizonYears),
        user_importance: Number(userImportance)
      });
      setDescription('');
      setTargetAmount('');
      loadGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to add goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteGoal(id);
      loadGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Calculating priority-ranked goals and 5-year compounding model...</p>
      </div>
    );
  }

  const { rankingResult, investBucket, market } = data;
  const rankedGoals = rankingResult?.rankedGoals || [];
  const projectionData = rankingResult?.projection5Year || [];
  const surplusWealth = rankingResult?.surplusWealthAllocation || 0;
  const totalNeeded = rankingResult?.totalGoalsMonthlyNeeded || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Page Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Target size={22} color="var(--accent-green)" />
              <span>Priority-Based Goal Funding Engine</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Multi-factor priority waterfall ranks your household dreams and projects compound returns over 5 years.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Investment Pool: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{investBucket.toLocaleString()}/mo</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Active Goals Needed: <strong>₹{totalNeeded.toLocaleString()}/mo</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Surplus Compounding Pool: <strong style={{ color: 'var(--accent-green)' }}>₹{surplusWealth.toLocaleString()}/mo</strong>
          </div>
        </div>
      </div>

      {/* 2. Dual Form & Ranked Goals Grid */}
      <div className="finai-dashboard-split-row">
        {/* Form to Add Goal */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>Add Long-Term Household Goal</span>
          </h3>

          <form onSubmit={handleAddGoal}>
            <div className="form-group">
              <label className="form-label">Goal Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Higher Education / House Down Payment"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Target Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="500000"
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
                  step="0.5"
                  className="form-input"
                  placeholder="3"
                  min="0.5"
                  max="30"
                  value={horizonYears}
                  onChange={e => setHorizonYears(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Importance to Family (1-10)</label>
                <span style={{ fontWeight: 800, color: 'var(--accent-green-hover)' }}>{userImportance} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={userImportance}
                onChange={e => setUserImportance(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-green)', cursor: 'pointer', marginTop: '0.35rem', width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Adding...' : 'Add Goal to Ranking Engine'}</span>
            </button>
          </form>
        </div>

        {/* Priority Ranked Goals List */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="var(--accent-green)" />
            <span>Priority Ranked Goals ({rankedGoals.length})</span>
          </h3>

          {rankedGoals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No long-term goals added yet. Add goals using the form to see automatic monthly investment allocation!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '420px' }}>
              {rankedGoals.map((goal: any, index: number) => (
                <div
                  key={goal.id}
                  style={{
                    background: 'var(--card-bg-subtle)',
                    border: '1px solid var(--card-border)',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--sidebar-active-bg)' : 'var(--card-border)',
                          color: index === 0 ? '#4ade80' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}
                      >
                        #{goal.priority_rank}
                      </span>
                      <strong style={{ fontSize: '0.92rem' }}>{goal.description}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        className="finai-circle-btn"
                        style={{ width: '28px', height: '28px' }}
                        onClick={() => setEditingGoal(goal)}
                        title="Edit Goal"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        className="finai-circle-btn"
                        style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                        onClick={() => handleDelete(goal.id)}
                        title="Delete Goal"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Target: <strong>₹{goal.target_amount.toLocaleString()}</strong> in {goal.horizon_years} yrs • Monthly Alloc: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{goal.allocated_invest_amount?.toLocaleString()}/mo</strong>
                  </div>

                  {goal.explanation && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--card-border)', paddingTop: '0.35rem' }}>
                      💡 {goal.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5-Year Projection Chart */}
      <div className="finai-card">
        <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--accent-green)" />
          <span>5-Year Wealth Compounding & Goal Trajectory Model</span>
        </h3>

        <GoalProjectionChart data={projectionData} />
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSuccess={loadGoals}
        />
      )}

    </div>
  );
};
