import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Activity, ShieldCheck, BarChart2 } from 'lucide-react';
import { MarketSnapshot, fetchMarketData, simulateMarketTrend } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MarketPageProps {
  familyId?: number;
  onRefreshParent: () => void;
}

export const MarketPage: React.FC<MarketPageProps> = ({ familyId, onRefreshParent }) => {
  const [data, setData] = useState<{ snapshot: MarketSnapshot; history: MarketSnapshot[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const loadMarket = async () => {
    setLoading(true);
    try {
      const res = await fetchMarketData();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
  }, []);

  const handleSimulate = async (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    setSimulating(true);
    try {
      await simulateMarketTrend(trend, familyId);
      await loadMarket();
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to update market signal');
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading live market trend signals...</p>
      </div>
    );
  }

  const { snapshot, history } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Top Market Signal Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="finai-stat-label">Live Market Signal Engine</span>
              <span className={`badge ${snapshot.trend_direction === 'BULLISH' ? 'badge-accepted' : snapshot.trend_direction === 'BEARISH' ? 'badge-bearish' : 'badge-neutral'}`}>
                {snapshot.trend_direction}
              </span>
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {snapshot.index_value.toLocaleString()} PTS
              <span style={{ fontSize: '1rem', color: snapshot.change_percent >= 0 ? 'var(--accent-green-hover)' : 'var(--accent-red)', marginLeft: '0.75rem' }}>
                {snapshot.change_percent >= 0 ? '+' : ''}{snapshot.change_percent}%
              </span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Snapshot Date: <strong>{snapshot.date}</strong> | Dynamically shifts monthly asset allocation
            </p>
          </div>

          {/* Simulator Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Simulate Market Trend Shift:
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                className={`finai-tab-pill-btn ${snapshot.trend_direction === 'BULLISH' ? 'active' : ''}`}
                style={{ background: snapshot.trend_direction === 'BULLISH' ? 'var(--accent-green)' : 'var(--card-bg-subtle)' }}
                disabled={simulating}
                onClick={() => handleSimulate('BULLISH')}
              >
                Bullish (+5% Invest)
              </button>
              <button
                className={`finai-tab-pill-btn ${snapshot.trend_direction === 'NEUTRAL' ? 'active' : ''}`}
                style={{ background: snapshot.trend_direction === 'NEUTRAL' ? 'var(--sidebar-active-bg)' : 'var(--card-bg-subtle)' }}
                disabled={simulating}
                onClick={() => handleSimulate('NEUTRAL')}
              >
                Neutral
              </button>
              <button
                className={`finai-tab-pill-btn ${snapshot.trend_direction === 'BEARISH' ? 'active' : ''}`}
                style={{ background: snapshot.trend_direction === 'BEARISH' ? 'var(--accent-red)' : 'var(--card-bg-subtle)' }}
                disabled={simulating}
                onClick={() => handleSimulate('BEARISH')}
              >
                Bearish (+5% Cash)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Historical Index Trend Chart */}
      <div className="finai-card">
        <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--accent-green)" />
          <span>Historical Index Benchmark & Volatility (30-Day Window)</span>
        </h3>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#121c15', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '0.8rem' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} PTS`, 'Index Value']}
              />
              <Line
                type="monotone"
                dataKey="index_value"
                stroke="var(--accent-green)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--accent-green)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Asset Allocation Philosophy */}
      <div className="finai-stat-grid-3">
        <div className="finai-white-card">
          <div className="finai-metric-header">
            <span>Bullish Market Bias</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Expands investment SIP allocation by +5%, allowing goals to compound faster in favorable equities.
          </div>
        </div>

        <div className="finai-white-card">
          <div className="finai-metric-header">
            <span>Neutral Balanced Plan</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Maintains the standard 50/30/20 baseline allocation across essential needs, wealth creation, and liquidity.
          </div>
        </div>

        <div className="finai-white-card">
          <div className="finai-metric-header">
            <span>Bearish Capital Preservation</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Defensively routes +5% into cash reserves to buffer against down-markets and inflation.
          </div>
        </div>
      </div>

    </div>
  );
};
