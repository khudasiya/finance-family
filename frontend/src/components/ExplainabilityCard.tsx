import React from 'react';
import { Lightbulb, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

interface ExplainabilityCardProps {
  splitExplanation?: string;
  marketTrend?: string;
  knapsackExplanations?: Record<number, { accepted: boolean; reason: string }>;
  goalCount?: number;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  splitExplanation,
  marketTrend = 'NEUTRAL',
  goalCount = 0
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lightbulb size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Algorithmic Engine Summary</h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Traceable Math Audit
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.3rem' }}>
            <TrendingUp size={15} />
            <span>Market-Aware Split</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {splitExplanation || `Income split dynamically based on ${marketTrend} market signal.`}
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginBottom: '0.3rem' }}>
            <Cpu size={15} />
            <span>0/1 Knapsack DP</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Maximizes item priority score within exact discretionary budget capacity using classic 2D Dynamic Programming.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#a855f7', marginBottom: '0.3rem' }}>
            <ShieldCheck size={15} />
            <span>Proportional Goal Ranking</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Goals scored by urgency, importance, and income scale, distributing investment pool proportionally.
          </p>
        </div>
      </div>
    </div>
  );
};

