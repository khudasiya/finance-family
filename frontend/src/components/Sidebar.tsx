import React, { useState } from 'react';
import {
  LayoutGrid,
  ReceiptText,
  BarChart3,
  Sparkles,
  Target,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Send,
  SlidersHorizontal,
  Maximize2,
  ShieldCheck
} from 'lucide-react';
import { Family } from '../services/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentFamily: Family | null;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onAskAI?: (prompt: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentFamily,
  onLogout,
  onOpenSettings,
  onOpenHelp,
  onAskAI
}) => {
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    if (onAskAI) {
      onAskAI(aiPrompt.trim());
    }
    setAiPrompt('');
  };

  const handleChipClick = (prompt: string) => {
    if (onAskAI) {
      onAskAI(prompt);
    }
  };

  return (
    <aside className="finai-sidebar">
      <div>
        {/* Brand Header */}
        <div className="finai-sidebar-brand">
          <div className="finai-logo-group" onClick={() => setActiveTab('dashboard')}>
            <div className="finai-logo-icon">
              <span>FF</span>
            </div>
            <span className="finai-brand-text">Finance <span style={{ color: 'var(--accent-green-hover)' }}>Family</span></span>
          </div>

          <button
            className="finai-circle-btn"
            style={{ width: '28px', height: '28px' }}
            title="Expand View"
            onClick={() => setActiveTab('dashboard')}
          >
            <SlidersHorizontal size={13} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="finai-sidebar-nav">
          {/* MAIN */}
          <div>
            <div className="finai-nav-group-label">MAIN</div>
            <div className="finai-nav-items-list">
              <button
                className={`finai-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutGrid size={17} className="nav-icon" />
                <span>Overview</span>
              </button>

              <button
                className={`finai-nav-link ${activeTab === 'spending' ? 'active' : ''}`}
                onClick={() => setActiveTab('spending')}
              >
                <ReceiptText size={17} className="nav-icon" />
                <span>Transactions</span>
              </button>

              <button
                className={`finai-nav-link ${activeTab === 'market' ? 'active' : ''}`}
                onClick={() => setActiveTab('market')}
              >
                <BarChart3 size={17} className="nav-icon" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* MONEY CONTROL */}
          <div>
            <div className="finai-nav-group-label">MONEY CONTROL</div>
            <div className="finai-nav-items-list">
              <button
                className={`finai-nav-link ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                <Target size={17} className="nav-icon" />
                <span>Goals & Optimizer</span>
              </button>

              <button
                className={`finai-nav-link ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <ShieldCheck size={17} className="nav-icon" />
                <span>Monthly Audit & Locker</span>
              </button>

              <button
                className={`finai-nav-link ${activeTab === 'debts' || activeTab === 'emergency-networth' ? 'active' : ''}`}
                onClick={() => setActiveTab('debts')}
              >
                <CreditCard size={17} className="nav-icon" />
                <span>Cards & Debts</span>
              </button>
            </div>
          </div>

          {/* OTHERS */}
          <div>
            <div className="finai-nav-group-label">OTHERS</div>
            <div className="finai-nav-items-list">
              <button
                className={`finai-nav-link ${activeTab === 'tax-planner' ? 'active' : ''}`}
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                  else setActiveTab('tax-planner');
                }}
              >
                <Settings size={17} className="nav-icon" />
                <span>Settings</span>
              </button>

              <button
                className={`finai-nav-link ${activeTab === 'bills' ? 'active' : ''}`}
                onClick={() => {
                  if (onOpenHelp) onOpenHelp();
                  else setActiveTab('bills');
                }}
              >
                <HelpCircle size={17} className="nav-icon" />
                <span>Help & Bills</span>
              </button>

              <button
                className="finai-nav-link"
                onClick={onLogout}
                style={{ color: 'var(--accent-red)' }}
              >
                <LogOut size={17} className="nav-icon" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom AI Assistant Widget */}
      <div className="finai-ai-assistant-widget">
        <div className="finai-ai-widget-header">
          <Sparkles size={14} color="var(--accent-green)" />
          <span>AI Assistant</span>
          <span className="ai-status-dot" />
        </div>

        <form onSubmit={handleSendPrompt} className="finai-ai-input-pill">
          <input
            type="text"
            placeholder="Ask me anything finance..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button type="submit" className="finai-ai-send-btn" title="Send to AI Assistant">
            <Send size={13} />
          </button>
        </form>

        <div className="finai-ai-prompts">
          <button
            type="button"
            className="finai-ai-prompt-chip"
            onClick={() => handleChipClick('Give me 3 spending optimization tips for this week')}
          >
            Spending tips
          </button>
          <button
            type="button"
            className="finai-ai-prompt-chip"
            onClick={() => handleChipClick('How should I adjust my monthly 50/30/20 budget?')}
          >
            Budget help
          </button>
        </div>
      </div>
    </aside>
  );
};
