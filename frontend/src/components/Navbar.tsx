import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Target,
  TrendingUp,
  Wallet,
  Users,
  LogOut,
  CreditCard,
  ShieldCheck,
  Calculator,
  Calendar,
  Lock
} from 'lucide-react';
import { Family } from '../services/api';

interface NavbarProps {
  families: Family[];
  currentFamily: Family | null;
  onSelectFamily: (fam: Family) => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  themeMode: 'dark' | 'light';
  setThemeMode: (theme: 'dark' | 'light') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  families,
  currentFamily,
  onSelectFamily,
  onLogout,
  activeTab,
  setActiveTab,
  themeMode,
  setThemeMode
}) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <TrendingUp size={26} color="var(--accent-primary)" />
          <span>Finance <span className="brand-badge">Family</span></span>
        </div>

        <nav className="nav-links" style={{ gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard & Overview"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
            title="Purchase Optimizer (0/1 Knapsack)"
          >
            <ShoppingBag size={16} />
            <span>Purchases</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'spending' ? 'active' : ''}`}
            onClick={() => setActiveTab('spending')}
            title="Spending Log & Tracker"
          >
            <Wallet size={16} />
            <span>Spending Log</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
            title="Goals & 5-Yr Projections"
          >
            <Target size={16} />
            <span>Goals</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
            title="Market Trend Signals"
          >
            <TrendingUp size={16} />
            <span>Market View</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'debts' ? 'active' : ''}`}
            onClick={() => setActiveTab('debts')}
            title="Debt & Loan Payoff Tracker"
          >
            <CreditCard size={16} />
            <span>Debt Payoff</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'emergency-networth' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency-networth')}
            title="Emergency Fund & Net Worth"
          >
            <ShieldCheck size={16} />
            <span>Net Worth</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tax-planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('tax-planner')}
            title="Tax Estimator & Deductions"
          >
            <Calculator size={16} />
            <span>Tax Planner</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
            title="Monthly Expense Audit & Safe Locker"
          >
            <Lock size={16} />
            <span>Monthly Audit</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
            title="Recurring Bills & Subscriptions"
          >
            <Calendar size={16} />
            <span>Bills</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Theme Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card-hover)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <select
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as any)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="dark" style={{ background: '#121826', color: '#fff' }}>🌙 Dark</option>
              <option value="light" style={{ background: '#ffffff', color: '#18181b' }}>☀️ Light</option>
            </select>
          </div>

          {/* Household Account Selector */}
          {currentFamily && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card-hover)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Users size={14} color="var(--accent-primary)" />
              <select
                value={currentFamily.id}
                onChange={(e) => {
                  const selected = families.find(f => f.id === Number(e.target.value));
                  if (selected) onSelectFamily(selected);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {families.map(fam => (
                  <option key={fam.id} value={fam.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    {fam.name} (₹{Number(fam.total_monthly_income).toLocaleString()}/mo)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Logout Button */}
          <button
            className="btn btn-secondary"
            onClick={onLogout}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            title="Logout of Household Account"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
