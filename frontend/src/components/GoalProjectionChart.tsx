import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ProjectionPoint {
  year: number;
  label: string;
  withPlan: number;
  withoutPlan: number;
}

interface GoalProjectionChartProps {
  data: ProjectionPoint[];
}

export const GoalProjectionChart: React.FC<GoalProjectionChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: '#121826',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="withPlan"
            name="With Finance Family Plan (Algorithmic Compounding)"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 5, fill: '#10b981' }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="withoutPlan"
            name="Without a Plan (Ad-hoc Linear Saving)"
            stroke="#64748b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#64748b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
