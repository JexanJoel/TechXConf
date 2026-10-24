import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const features = [
  { icon: '💬', text: 'Chat with your PDF instantly' },
  { icon: '📝', text: 'AI-generated mock tests' },
  { icon: '⚡', text: 'One-click cheat sheets' },
  { icon: '🔮', text: 'Exam predictions with confidence scores' },
]

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) return setError('Please fill in all fields')
    if (mode === 'register' && !name) return setError('Please enter your name')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)

    if (mode === 'register') {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (err) { setError(err.message); setLoading(false); return }
      if (data.session) {
        navigate('/dashboard')
      } else {
        setError('Check your email to confirm your account, or disable email confirmation in Supabase.')
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      navigate('/dashboard')
    }
    setLoading(false)
  }

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="auth-root">

      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-bg1" />
        <div className="auth-left-bg2" />
        <div className="auth-left-dots" />

        <div className="auth-left-logo">
          <span className="auth-left-logo-icon">📚</span>
          <span className="auth-left-logo-text">LearnLens</span>
        </div>

        <div className="auth-left-body">
          <h2 className="auth-left-title">
            {mode === 'login' ? 'Study smarter,\nexam ready.' : 'Join students,\nlearn smarter.'}
          </h2>
          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="auth-stats">
            <div className="auth-stat">
              <p className="auth-stat-val">100%</p>
              <p className="auth-stat-label">Free</p>
            </div>
            <div className="auth-stat">
              <p className="auth-stat-val">6</p>
              <p className="auth-stat-label">AI Agents</p>
            </div>
            <div className="auth-stat">
              <p className="auth-stat-val">MIT</p>
              <p className="auth-stat-label">License</p>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          © 2026 LearnLens · Open Source · MIT License
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <Link to="/" className="auth-back">← Back to home</Link>

        <div className="auth-mobile-logo">
          <span>📚</span>
          <span className="auth-left-logo-text">LearnLens</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="auth-card-sub">
              {mode === 'login' ? 'Sign in to continue learning' : 'Free forever · No credit card needed'}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="auth-oauth">
            <button className="auth-oauth-btn" onClick={handleGitHub}>
              <GitHubIcon /> GitHub
            </button>
            <button className="auth-oauth-btn" onClick={handleGoogle}>
              <GoogleIcon /> Google
            </button>
          </div>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">OR</span>
            <span className="auth-divider-line" />
          </div>

          {/* Fields */}
          <div className="auth-fields">
            {mode === 'register' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div>
              <input
                className="auth-input"
                type="password"
                placeholder={mode === 'register' ? 'Password (min 6 characters)' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              {mode === 'login' && (
                <div className="auth-forgot">
                  <span className="auth-forgot-link">Forgot password?</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : mode === 'login' ? 'Sign in' : 'Create free account'}
          </button>

          {mode === 'register' && (
            <p className="auth-terms">
              By signing up you agree to our <span className="auth-terms-link">Terms</span> & <span className="auth-terms-link">Privacy Policy</span>
            </p>
          )}
        </div>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span
            className="auth-switch-link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Create one free' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}