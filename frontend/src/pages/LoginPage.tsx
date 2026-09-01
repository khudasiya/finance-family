import React, { useState } from 'react';
import { Lock, Mail, User, DollarSign, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { loginUser, registerUser, Family } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (family: Family) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('sharma@financefamily.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [income, setIncome] = useState('150000');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !income || Number(income) <= 0) {
          throw new Error('Please enter valid household name and monthly income');
        }
        const res = await registerUser({
          name,
          email,
          password,
          total_monthly_income: Number(income)
        });
        onLoginSuccess(res.family);
      } else {
        const res = await loginUser(email, password);
        onLoginSuccess(res.family);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--canvas-bg)'
      }}
    >
      <div
        className="modal-container"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: '0 20px 40px rgba(18, 28, 21, 0.08)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: '#121c15',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              color: '#4ade80',
              fontWeight: 800,
              fontSize: '1.3rem'
            }}
          >
            F
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
            FINAI
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {isRegister ? 'Register your household unit' : 'Welcome back to your financial intelligence hub'}
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              border: '1px solid var(--accent-red-border)',
              color: 'var(--accent-red)',
              padding: '0.65rem 0.9rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Household Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sharma Household"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="sharma@financefamily.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Monthly Household Income (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="150000"
                min="1"
                value={income}
                onChange={e => setIncome(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.92rem' }}
            disabled={loading}
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{loading ? 'Authenticating...' : isRegister ? 'Register Household' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Credentials Box */}
        {!isRegister && (
          <div
            style={{
              marginTop: '1.25rem',
              background: 'var(--card-bg-subtle)',
              border: '1px solid var(--card-border)',
              padding: '0.75rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              💡 Demo Credentials:
            </div>
            <div>Email: <code>sharma@financefamily.com</code></div>
            <div>Password: <code>password123</code></div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--accent-green-hover)', cursor: 'pointer', fontWeight: 700 }}
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need to register a household? Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
