import React, { useState } from 'react';
import { Grid, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { KnapsackResult } from '../services/api';

interface KnapsackTableProps {
  knapsackResult: KnapsackResult;
}

export const KnapsackTable: React.FC<KnapsackTableProps> = ({ knapsackResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { dpMatrix, capacity, totalCost, totalValue } = knapsackResult;

  if (!dpMatrix || !dpMatrix.grid || dpMatrix.grid.length === 0) {
    return null;
  }

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div
        className="card-header"
        style={{ cursor: 'pointer', marginBottom: isOpen ? '1rem' : '0' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="card-title">
            <Grid className="text-indigo-400" size={20} color="#6366f1" />
            <span>0/1 Knapsack DP Table Visualizer</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            State matrix grid: DP[i][w] = max value for first i items with capacity w.
          </p>
        </div>

        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{isOpen ? 'Hide DP Matrix' : 'View DP Matrix Grid'}</span>
        </button>
      </div>

      {isOpen && (
        <div>
          <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Discretionary Capacity:</span> <strong>₹{capacity.toLocaleString()}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Selected Cost:</span> <strong style={{ color: '#34d399' }}>₹{totalCost.toLocaleString()}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Total Priority Score:</span> <strong style={{ color: '#a855f7' }}>{totalValue} pts</strong></div>
          </div>

          <div className="dp-table-wrapper">
            <table className="dp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Item / Capacity (₹)</th>
                  {dpMatrix.capacityHeaders.map((cap, idx) => (
                    <th key={idx}>₹{cap.toLocaleString()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dpMatrix.grid.map((row, itemIdx) => (
                  <tr key={itemIdx}>
                    <td style={{ textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {dpMatrix.itemNames[itemIdx]}
                    </td>
                    {row.map((val, capIdx) => {
                      const isMax = itemIdx === dpMatrix.grid.length - 1 && capIdx === row.length - 1;
                      return (
                        <td key={capIdx} className={isMax ? 'highlight' : ''}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="explain-box">
            <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <HelpCircle size={16} color="#6366f1" />
              <span>How to Read this DP Grid:</span>
            </div>
            <p>
              Row 0 represents 0 items requested (value 0 across all capacity headers). Each subsequent row evaluates item <em>i</em>.
              If the item cost fits in capacity column <em>w</em>, the DP solver compares <code>DP[i-1][w]</code> against <code>DP[i-1][w - cost] + priority_weight</code> and stores the optimal choice. The bottom-right cell represents the global maximum priority score achieved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
