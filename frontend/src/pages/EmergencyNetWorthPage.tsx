import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Activity, Wallet, Landmark } from 'lucide-react';
import { fetchAssets, addAsset, deleteAsset } from '../services/api';

interface EmergencyNetWorthPageProps {
  familyId: number;
  onRefreshParent?: () => void;
}

export const EmergencyNetWorthPage: React.FC<EmergencyNetWorthPageProps> = ({ familyId, onRefreshParent }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('Savings/Cash');
  const [isLiquid, setIsLiquid] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetchAssets(familyId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadAssets();
    }
  }, [familyId]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value || Number(value) < 0) return;

    setSubmitting(true);
    try {
      await addAsset({
        family_id: familyId,
        name,
        value: Number(value),
        category,
        is_liquid: isLiquid
      });
      setName('');
      setValue('');
      loadAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAsset(id);
      loadAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Calculating emergency fund buffer & household net worth...</p>
      </div>
    );
  }

  const assets = data.assets || [];
  const summary = data.summary || {
    totalAssets: 0,
    liquidAssets: 0,
    totalDebts: 0,
    netWorth: 0,
    emergencyRunwayMonths: 0,
    monthlyEssentials: 0,
    runwayStatus: 'NEEDS_BUFFER'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Page Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={22} color="var(--accent-green)" />
              <span>Emergency Runway & Household Net Worth Tracker</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Calculates liquid runway buffer in months based on monthly essentials burn rate.
            </p>
          </div>
        </div>

        {/* 4 Metric Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Household Net Worth: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{summary.netWorth.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Liquid Cash Reserve: <strong>₹{summary.liquidAssets.toLocaleString()}</strong>
          </div>
          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.45rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '0.8rem' }}>
            Emergency Runway: <strong style={{ color: summary.runwayStatus === 'HEALTHY' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{summary.emergencyRunwayMonths} Months ({summary.runwayStatus})</strong>
          </div>
        </div>
      </div>

      {/* 2. Dual Form & Assets Grid */}
      <div className="finai-dashboard-split-row">
        
        {/* Left: Add Asset Form */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} color="var(--accent-green)" />
            <span>Add Asset or Investment Holding</span>
          </h3>

          <form onSubmit={handleAddAsset}>
            <div className="form-group">
              <label className="form-label">Asset / Account Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC Savings / Mutual Fund SIP / Gold"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Current Value (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="100000"
                  min="0"
                  value={value}
                  onChange={e => setValue(e.target.value)}
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
                  <option value="Savings/Cash">Savings / Cash</option>
                  <option value="Mutual Funds/Stocks">Mutual Funds / Stocks</option>
                  <option value="Fixed Deposit/PPF">Fixed Deposit / PPF</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Gold/Precious">Gold / Precious Metals</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <input
                type="checkbox"
                id="isLiquidCheckbox"
                checked={isLiquid}
                onChange={e => setIsLiquid(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
              />
              <label htmlFor="isLiquidCheckbox" className="form-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                This is a liquid cash asset (count toward emergency runway)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Adding...' : 'Add Asset to Balance Sheet'}</span>
            </button>
          </form>
        </div>

        {/* Right: Asset List */}
        <div className="finai-card">
          <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Landmark size={16} color="var(--accent-green)" />
            <span>Household Assets Balance Sheet ({assets.length})</span>
          </h3>

          {assets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic', padding: '1rem 0' }}>
              No assets added yet. Add your savings, investments, and assets to calculate your net worth!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '420px' }}>
              {assets.map((asset: any) => (
                <div
                  key={asset.id}
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
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>{asset.name}</span>
                      {asset.is_liquid && <span className="badge badge-accepted" style={{ fontSize: '0.68rem' }}>Liquid Buffer</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Category: {asset.category}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-green-hover)' }}>
                      ₹{asset.value.toLocaleString()}
                    </div>

                    <button
                      className="finai-circle-btn"
                      style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                      onClick={() => handleDelete(asset.id)}
                      title="Delete Asset"
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
