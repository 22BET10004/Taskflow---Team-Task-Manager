import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function AuthForm({ mode }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const { data } = await api.post(endpoint, form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>
        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your workspace' : 'Start managing your projects'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Manik Singh" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Loading…</> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-divider" style={{ marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link className="auth-link" to={mode === 'login' ? '/signup' : '/login'}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LoginPage() { return <AuthForm mode="login" />; }
export function SignupPage() { return <AuthForm mode="signup" />; }
