import React, { useState } from 'react';
import { Calculator, Sparkles, Shield, ArrowRight, Award } from 'lucide-react';
import { Family } from '../services/api';

interface TaxPlannerPageProps {
  family: Family;
}

export const TaxPlannerPage: React.FC<TaxPlannerPageProps> = ({ family }) => {
  const totalMonthlyIncome = Number(family.total_monthly_income);
  const annualIncome = totalMonthlyIncome * 12;

  const [section80C, setSection80C] = useState('150000');
  const [section80D, setSection80D] = useState('25000');
  const [npsContribution, setNpsContribution] = useState('50000');

  const num80C = Math.min(150000, Number(section80C || 0));
  const num80D = Math.min(75000, Number(section80D || 0));
  const numNps = Math.min(50000, Number(npsContribution || 0));
  const totalDeductions = num80C + num80D + numNps + 50000;

  // 1. Calculate Tax under Old Tax Regime
  const oldTaxableIncome = Math.max(0, annualIncome - totalDeductions);
  let oldTax = 0;
  if (oldTaxableIncome > 1000000) {
    oldTax = 112500 + (oldTaxableIncome - 1000000) * 0.30;
  } else if (oldTaxableIncome > 500000) {
    oldTax = 12500 + (oldTaxableIncome - 500000) * 0.20;
  } else if (oldTaxableIncome > 250000) {
    oldTax = (oldTaxableIncome - 250000) * 0.05;
  }
  if (oldTaxableIncome <= 500000) oldTax = 0;
  oldTax = Math.round(oldTax * 1.04);

  // 2. Calculate Tax under New Tax Regime
  const newTaxableIncome = Math.max(0, annualIncome - 75000);
  let newTax = 0;
  if (newTaxableIncome > 1500000) {
    newTax = 150000 + (newTaxableIncome - 1500000) * 0.30;
  } else if (newTaxableIncome > 1200000) {
    newTax = 90000 + (newTaxableIncome - 1200000) * 0.20;
  } else if (newTaxableIncome > 900000) {
    newTax = 45000 + (newTaxableIncome - 900000) * 0.15;
  } else if (newTaxableIncome > 600000) {
    newTax = 15000 + (newTaxableIncome - 600000) * 0.10;
  } else if (newTaxableIncome > 300000) {
    newTax = (newTaxableIncome - 300000) * 0.05;
  }
  if (newTaxableIncome <= 700000) newTax = 0;
  newTax = Math.round(newTax * 1.04);

  const recommendedRegime = oldTax < newTax ? 'OLD' : 'NEW';
  const taxSavingsAmount = Math.abs(oldTax - newTax);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Page Header Card */}
      <div className="finai-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div className="finai-page-header">
          <div>
            <h2 className="finai-section-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calculator size={22} color="var(--accent-green)" />
              <span>Income Tax Estimator & Deductions Planner</span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Simulates Old Regime vs. New Regime and calculates maximum tax savings.
            </p>
          </div>

          <div style={{ background: 'var(--card-bg-subtle)', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={18} color="var(--accent-green)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Recommendation
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-green-hover)' }}>
                {recommendedRegime === 'OLD' ? `Old Regime (Saves ₹${taxSavingsAmount.toLocaleString()})` : `New Regime (Saves ₹${taxSavingsAmount.toLocaleString()})`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Regime Comparison */}
      <div className="finai-stat-grid-2">
        {/* Old Regime Card */}
        <div className="finai-white-card" style={{ border: recommendedRegime === 'OLD' ? '2px solid var(--accent-green)' : '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="finai-metric-header">
              <span>Old Tax Regime</span>
            </div>
            {recommendedRegime === 'OLD' && <span className="badge badge-accepted">⭐ Optimal Choice</span>}
          </div>

          <div className="finai-metric-value" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            ₹{oldTax.toLocaleString()} <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ year</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
            <div>Gross Annual Income: <strong>₹{annualIncome.toLocaleString()}</strong></div>
            <div>Total Deductions (80C/80D/NPS/STD): <strong style={{ color: 'var(--accent-green-hover)' }}>₹{totalDeductions.toLocaleString()}</strong></div>
            <div>Net Taxable Income: <strong>₹{oldTaxableIncome.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* New Regime Card */}
        <div className="finai-white-card" style={{ border: recommendedRegime === 'NEW' ? '2px solid var(--accent-green)' : '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="finai-metric-header">
              <span>New Tax Regime</span>
            </div>
            {recommendedRegime === 'NEW' && <span className="badge badge-accepted">⭐ Optimal Choice</span>}
          </div>

          <div className="finai-metric-value" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            ₹{newTax.toLocaleString()} <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ year</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
            <div>Gross Annual Income: <strong>₹{annualIncome.toLocaleString()}</strong></div>
            <div>Standard Deduction: <strong>₹75,000</strong> (FY 2024-25)</div>
            <div>Net Taxable Income: <strong>₹{newTaxableIncome.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      {/* 3. Deductions Simulator Form */}
      <div className="finai-card">
        <h3 className="finai-section-title" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} color="var(--accent-green)" />
          <span>Interactive Deductions & Exemption Sliders (Old Regime)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Section 80C (PPF, ELSS, EPF) [Max ₹1.5L]</label>
            <input
              type="number"
              className="form-input"
              value={section80C}
              onChange={e => setSection80C(e.target.value)}
              placeholder="150000"
              max="150000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Section 80D (Health Insurance) [Max ₹75K]</label>
            <input
              type="number"
              className="form-input"
              value={section80D}
              onChange={e => setSection80D(e.target.value)}
              placeholder="25000"
              max="75000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Section 80CCD(1B) NPS [Max ₹50K]</label>
            <input
              type="number"
              className="form-input"
              value={npsContribution}
              onChange={e => setNpsContribution(e.target.value)}
              placeholder="50000"
              max="50000"
              min="0"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
