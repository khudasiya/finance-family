import React, { useState } from 'react';
import { Utensils, Home, Car, Zap, HeartPulse, Film, Save, X, PieChart, Sliders, Check } from 'lucide-react';

interface CategoryBreakdown {
  housing: number;
  food: number;
  transport: number;
  utilities: number;
  healthcare: number;
  leisure: number;
}

interface EditExpensesModalProps {
  totalSpendBudget: number;
  initialBreakdown?: Partial<CategoryBreakdown> | null;
  onClose: () => void;
  onSave: (breakdown: CategoryBreakdown | null, newTotalSpend?: number) => void;
}

export const EditExpensesModal: React.FC<EditExpensesModalProps> = ({
  totalSpendBudget,
  initialBreakdown,
  onClose,
  onSave
}) => {
  const [isItemized, setIsItemized] = useState<boolean>(Boolean(initialBreakdown));
  const [lumpSumBudget, setLumpSumBudget] = useState<string>(String(totalSpendBudget));

  // Itemized inputs (Default to 0 or saved custom breakdown — ZERO fake 21600/13500 defaults!)
  const [housing, setHousing] = useState<number>(initialBreakdown?.housing || 0);
  const [food, setFood] = useState<number>(initialBreakdown?.food || 0);
  const [transport, setTransport] = useState<number>(initialBreakdown?.transport || 0);
  const [utilities, setUtilities] = useState<number>(initialBreakdown?.utilities || 0);
  const [healthcare, setHealthcare] = useState<number>(initialBreakdown?.healthcare || 0);
  const [leisure, setLeisure] = useState<number>(initialBreakdown?.leisure || 0);

  const totalSum = housing + food + transport + utilities + healthcare + leisure;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isItemized) {
      // User chose simple lump sum monthly living budget — clear subcategories!
      const newSpend = Math.max(0, Number(lumpSumBudget) || 0);
      onSave(null, newSpend);
    } else {
      // User chose itemized breakdown
      onSave({
        housing,
        food,
        transport,
        utilities,
        healthcare,
        leisure
      }, totalSum > 0 ? totalSum : Number(lumpSumBudget));
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PieChart size={22} color="var(--accent-green)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Living Expenses (Needs)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You are in full control: Edit your total monthly living expenses directly or itemize by subcategories.
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

        {/* Mode Selector Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--card-bg-subtle)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <button
            type="button"
            onClick={() => setIsItemized(false)}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              background: !isItemized ? 'var(--accent-green)' : 'transparent',
              color: !isItemized ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            💳 Simple Total Living Budget
          </button>

          <button
            type="button"
            onClick={() => setIsItemized(true)}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              background: isItemized ? 'var(--accent-green)' : 'transparent',
              color: isItemized ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            🧩 Itemize Subcategories (Rent, Bills, etc.)
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {!isItemized ? (
            /* Mode 1: Simple Lump-Sum Living Expense Input */
            <div style={{ background: 'var(--card-bg-subtle)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                Total Monthly Living Expenses (₹/mo)
              </label>
              <input
                type="number"
                className="form-input"
                style={{ fontSize: '1.3rem', fontWeight: 800, padding: '0.65rem 0.9rem', marginTop: '0.4rem' }}
                value={lumpSumBudget}
                onChange={e => setLumpSumBudget(e.target.value)}
                placeholder="67500"
                min="0"
                required
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Directly sets your monthly living budget. No forced subcategories or hardcoded defaults!
              </p>
            </div>
          ) : (
            /* Mode 2: Optional Subcategory Itemization (Zero Forced Defaults!) */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-subtle)', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Sum of Itemized Subcategories: <strong style={{ color: 'var(--accent-green-hover)' }}>₹{totalSum.toLocaleString()}</strong>
                </span>
                {totalSum > 0 && (
                  <button
                    type="button"
                    className="finai-ai-prompt-chip"
                    onClick={() => {
                      setHousing(0);
                      setFood(0);
                      setTransport(0);
                      setUtilities(0);
                      setHealthcare(0);
                      setLeisure(0);
                    }}
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {/* Housing & Rent */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Home size={14} color="#121c15" />
                    <span>Housing & Rent</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={housing || ''}
                    onChange={e => setHousing(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                {/* Food & Groceries */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Utensils size={14} color="#34d399" />
                    <span>Food & Groceries</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={food || ''}
                    onChange={e => setFood(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                {/* Transport */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Car size={14} color="#4ade80" />
                    <span>Transport & Fuel</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={transport || ''}
                    onChange={e => setTransport(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                {/* Utilities & Bills */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Zap size={14} color="#10b981" />
                    <span>Bills & Utilities</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={utilities || ''}
                    onChange={e => setUtilities(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                {/* Healthcare */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HeartPulse size={14} color="#86efac" />
                    <span>Healthcare & Wellness</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={healthcare || ''}
                    onChange={e => setHealthcare(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                {/* Leisure & Others */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Film size={14} color="#94a3b8" />
                    <span>Leisure & Lifestyle</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={leisure || ''}
                    onChange={e => setLeisure(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save size={15} />
              <span>Apply Expenses</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
