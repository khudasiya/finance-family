import React, { useState, useEffect } from 'react';
import { Search, Bell, Users, Moon, Sun, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { PurchasesPage } from './pages/PurchasesPage';
import { SpendingPage } from './pages/SpendingPage';
import { GoalsPage } from './pages/GoalsPage';
import { MarketPage } from './pages/MarketPage';
import { DebtPayoffPage } from './pages/DebtPayoffPage';
import { EmergencyNetWorthPage } from './pages/EmergencyNetWorthPage';
import { TaxPlannerPage } from './pages/TaxPlannerPage';
import { BillsPage } from './pages/BillsPage';
import { UnifiedGoalsPage } from './pages/UnifiedGoalsPage';
import { MonthlyAuditPage } from './pages/MonthlyAuditPage';
import { Onboarding } from './pages/Onboarding';
import { LoginPage } from './pages/LoginPage';
import { EditFamilyModal } from './components/EditFamilyModal';
import { Family, fetchFamilies, fetchPlanData, simulateMarketTrend } from './services/api';

export const App: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ff_theme');
    if (saved === 'dark') return 'dark';
    return 'light';
  });

  const [currentFamily, setCurrentFamily] = useState<Family | null>(() => {
    const saved = localStorage.getItem('ff_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [families, setFamilies] = useState<Family[]>([]);
  const [planData, setPlanData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Assistant Modal State
  const [aiModalData, setAiModalData] = useState<{ query: string; answer: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply Theme Mode attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('ff_theme', themeMode);
  }, [themeMode]);

  // Load Families
  const loadFamilies = async () => {
    try {
      const list = await fetchFamilies();
      setFamilies(list);

      if (list.length > 0) {
        if (!currentFamily || !list.find(f => f.id === currentFamily.id)) {
          const match = savedFamilyId() ? list.find(f => f.id === savedFamilyId()) : list[0];
          if (match) {
            setCurrentFamily(match);
            localStorage.setItem('ff_user', JSON.stringify(match));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load families:', err);
    } finally {
      setLoading(false);
    }
  };

  function savedFamilyId(): number | null {
    const saved = localStorage.getItem('ff_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved).id;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    loadFamilies();
  }, []);

  // Load Plan Data
  const loadPlan = async () => {
    if (!currentFamily) return;
    try {
      const data = await fetchPlanData(currentFamily.id);
      setPlanData(data);
    } catch (err) {
      console.error('Failed to load plan data:', err);
    }
  };

  useEffect(() => {
    if (currentFamily) {
      loadPlan();
    }
  }, [currentFamily]);

  // Market Simulation
  const handleSimulateMarket = async (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    if (!currentFamily) return;
    try {
      await simulateMarketTrend(trend, currentFamily.id);
      await loadPlan();
    } catch (err: any) {
      alert(err.message || 'Failed to update market simulation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ff_user');
    setCurrentFamily(null);
  };

  const handleLoginSuccess = (family: Family) => {
    setCurrentFamily(family);
    localStorage.setItem('ff_user', JSON.stringify(family));
    loadFamilies();
  };

  const handleFamilyUpdated = (updated: Family) => {
    setCurrentFamily(updated);
    localStorage.setItem('ff_user', JSON.stringify(updated));
    loadFamilies();
  };

  // Handle AI Assistant queries
  const handleAskAI = (prompt: string) => {
    const income = currentFamily ? Number(currentFamily.total_monthly_income) : 550000;
    const spend = planData?.plan ? Number(planData.plan.spend_budget) : income * 0.5;
    const save = planData?.plan ? Number(planData.plan.save_budget) : income * 0.2;
    const invest = planData?.plan ? Number(planData.plan.invest_budget) : income * 0.3;

    let response = `Based on your monthly household income of ₹${income.toLocaleString()} and active financial plan:`;
    if (prompt.toLowerCase().includes('spending') || prompt.toLowerCase().includes('tip')) {
      response = `💡 Spending Optimization Tips:\n• Keep daily food & dining expenses within ₹${Math.round(spend / 30).toLocaleString()} per day.\n• Leverage the 0/1 Knapsack optimizer under the Purchases tab to prioritize high-utility discretionary buys.\n• Shift automated subscriptions to your scheduled bills tracker to eliminate recurring unused charges.`;
    } else if (prompt.toLowerCase().includes('budget')) {
      response = `📊 Recommended 50/30/20 Breakdown:\n• Needs (Essentials): ₹${(income * 0.5).toLocaleString()} (50%)\n• Investments & Goals: ₹${(income * 0.3).toLocaleString()} (30%)\n• Emergency & Cash Savings: ₹${(income * 0.2).toLocaleString()} (20%)\nCurrently, your plan allocates ₹${spend.toLocaleString()} for essentials and ₹${invest.toLocaleString()} for investments.`;
    } else {
      response = `🤖 Financial Insight for "${prompt}":\nYour household financial health is rated as HEALTHY. All long-term goals are currently projected to meet targets on schedule with your current ₹${invest.toLocaleString()}/mo market investment allocation.`;
    }

    setAiModalData({ query: prompt, answer: response });
  };

  if (!currentFamily) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // User name formatting
  const rawName = currentFamily.name || 'Divine';
  const displayName = rawName.replace(/ family$/i, '').trim() || 'Divine';

  return (
    <div className="finai-app-frame">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentFamily={currentFamily}
        onLogout={handleLogout}
        onOpenSettings={() => setShowFamilyModal(true)}
        onOpenHelp={() => setShowOnboarding(true)}
        onAskAI={handleAskAI}
      />

      {/* 2. Main Dashboard & View Area */}
      <main className="finai-main-area">
        {/* Top Header */}
        <header className="finai-top-header">
          <div
            className="finai-user-profile-header"
            onClick={() => setShowFamilyModal(true)}
            style={{ cursor: 'pointer' }}
            title="Click to edit family name, photo, or income"
          >
            <div style={{ position: 'relative' }}>
              <img
                src={currentFamily.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={currentFamily.name}
                className="finai-user-avatar"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');
                }}
              />
            </div>
            <div>
              <h1 className="finai-greeting-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>Welcome, {currentFamily.name} 👋</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'var(--card-bg-subtle)',
                    border: '1px solid var(--card-border)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-pill)',
                    color: 'var(--accent-green-hover)',
                    fontWeight: 700
                  }}
                >
                  Edit
                </span>
              </h1>
              <p className="finai-greeting-sub">
                Here is your financial overview for today
              </p>
            </div>
          </div>

          <div className="finai-header-controls">
            {/* Search Button */}
            <button
              className="finai-circle-btn"
              onClick={() => setShowSearch(true)}
              title="Search transactions and goals"
            >
              <Search size={16} />
            </button>

            {/* Notification Bell */}
            <button
              className="finai-circle-btn"
              onClick={() => setShowNotifications(true)}
              title="Notifications"
            >
              <Bell size={16} />
              <span className="finai-badge-dot" />
            </button>

            {/* Theme Toggle */}
            <button
              className="finai-circle-btn"
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Household Switcher */}
            {families.length > 0 && (
              <select
                value={currentFamily.id}
                onChange={(e) => {
                  const match = families.find(f => f.id === Number(e.target.value));
                  if (match) {
                    setCurrentFamily(match);
                    localStorage.setItem('ff_user', JSON.stringify(match));
                  }
                }}
                className="finai-select-pill"
                title="Switch Household Profile"
              >
                {families.map(fam => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name} (₹{Number(fam.total_monthly_income).toLocaleString()}/mo)
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* View Router */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-muted)' }}>Connecting to FINAI financial engine...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                planData={planData}
                onSimulateMarket={handleSimulateMarket}
                onNavigateTab={setActiveTab}
                onRefreshPlan={loadPlan}
                onFamilyUpdated={handleFamilyUpdated}
              />
            )}

            {(activeTab === 'goals' || activeTab === 'purchases') && currentFamily && (
              <UnifiedGoalsPage
                familyId={currentFamily.id}
                planData={planData}
                onRefreshParent={loadPlan}
              />
            )}

            {activeTab === 'spending' && (
              <SpendingPage
                planData={planData}
                onRefreshParent={loadPlan}
              />
            )}

            {activeTab === 'market' && (
              <MarketPage
                familyId={currentFamily?.id}
                onRefreshParent={loadPlan}
              />
            )}

            {activeTab === 'debts' && currentFamily && (
              <DebtPayoffPage
                familyId={currentFamily.id}
                onRefreshParent={loadPlan}
              />
            )}

            {activeTab === 'emergency-networth' && currentFamily && (
              <EmergencyNetWorthPage
                familyId={currentFamily.id}
                onRefreshParent={loadPlan}
              />
            )}

            {activeTab === 'tax-planner' && currentFamily && (
              <TaxPlannerPage
                family={currentFamily}
              />
            )}

            {activeTab === 'audit' && currentFamily && (
              <MonthlyAuditPage
                familyId={currentFamily.id}
                planId={planData?.plan?.id}
                plannedEssentials={Number(planData?.plan?.spend_budget || 67500)}
                plannedDiscretionary={Number(planData?.plan?.discretionary_budget || 15000)}
                onRefreshPlan={loadPlan}
              />
            )}

            {activeTab === 'bills' && currentFamily && (
              <BillsPage
                familyId={currentFamily.id}
                onRefreshParent={loadPlan}
              />
            )}
          </>
        )}
      </main>

      {/* AI Assistant Response Modal */}
      {aiModalData && (
        <div className="modal-overlay" onClick={() => setAiModalData(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--accent-green)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI Financial Assistant</h3>
              </div>
              <button
                onClick={() => setAiModalData(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Your Query</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>"{aiModalData.query}"</div>
            </div>

            <div style={{ whiteSpace: 'pre-line', fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {aiModalData.answer}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => setAiModalData(null)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="var(--accent-green)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Notifications & Alerts</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--accent-green)' }}>🟢 0/1 Knapsack Optimizer Ran Successfully</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Discretionary purchases were filtered based on utility-to-cost knapsack dynamic programming.</div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>📅 Upcoming Bill Due: Netflix Subscription</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>₹650 scheduled on the 5th of this month.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowNotifications(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Search FINAI</h3>
              <button
                onClick={() => setShowSearch(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search transactions, goals, debts, bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div
                className="finai-nav-link"
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveTab('dashboard'); setShowSearch(false); }}
              >
                <span>📊 Dashboard Overview</span>
              </div>
              <div
                className="finai-nav-link"
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveTab('spending'); setShowSearch(false); }}
              >
                <span>🧾 Spending Logs & Transactions</span>
              </div>
              <div
                className="finai-nav-link"
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveTab('goals'); setShowSearch(false); }}
              >
                <span>🎯 Long-Term Household Goals</span>
              </div>
              <div
                className="finai-nav-link"
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveTab('bills'); setShowSearch(false); }}
              >
                <span>📅 Recurring Bills & Subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Household Profile & Photo Modal */}
      {showFamilyModal && currentFamily && (
        <EditFamilyModal
          family={currentFamily}
          onClose={() => setShowFamilyModal(false)}
          onSuccess={(updated) => {
            handleFamilyUpdated(updated);
            loadPlan();
          }}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding
          onSuccess={(newFam) => {
            setShowOnboarding(false);
            loadFamilies();
            handleLoginSuccess(newFam);
          }}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default App;
