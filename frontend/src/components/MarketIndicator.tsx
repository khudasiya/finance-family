import React from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { MarketSnapshot } from '../services/api';

interface MarketIndicatorProps {
  snapshot: MarketSnapshot | null;
  onSimulateTrend: (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => void;
  loading?: boolean;
}

export const MarketIndicator: React.FC<MarketIndicatorProps> = ({
  snapshot,
  onSimulateTrend,
  loading = false
}) => {
  if (!snapshot) return null;

  const getBadgeClass = (trend: string) => {
    if (trend === 'BULLISH') return 'badge-bullish';
    if (trend === 'BEARISH') return 'badge-bearish';
    return 'badge-neutral';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'BULLISH') return <TrendingUp size={16} />;
    if (trend === 'BEARISH') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <TrendingUp size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Market Index Signal
              </span>
              <span className={`badge ${getBadgeClass(snapshot.trend_direction)}`}>
                {getTrendIcon(snapshot.trend_direction)}
                {snapshot.trend_direction}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{snapshot.index_value.toLocaleString()}</span>
              <span style={{ fontSize: '0.85rem', color: snapshot.change_percent >= 0 ? '#34d399' : '#fb7185', fontWeight: 700 }}>
                {snapshot.change_percent >= 0 ? '+' : ''}{snapshot.change_percent}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simulate Signal:</span>
          <button
            className={`btn ${snapshot.trend_direction === 'BULLISH' ? 'btn-emerald' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            disabled={loading}
            onClick={() => onSimulateTrend('BULLISH')}
          >
            Bullish (+5% Invest)
          </button>
          <button
            className={`btn ${snapshot.trend_direction === 'NEUTRAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            disabled={loading}
            onClick={() => onSimulateTrend('NEUTRAL')}
          >
            Neutral (Baseline)
          </button>
          <button
            className={`btn ${snapshot.trend_direction === 'BEARISH' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: snapshot.trend_direction === 'BEARISH' ? 'var(--accent-rose)' : undefined }}
            disabled={loading}
            onClick={() => onSimulateTrend('BEARISH')}
          >
            Bearish (+5% Cash)
          </button>
        </div>
      </div>
    </div>
  );
};
