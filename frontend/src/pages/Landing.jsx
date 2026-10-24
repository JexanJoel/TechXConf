import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const GITHUB_URL = 'https://github.com/JexanJoel/LearnLens'

const GitHubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const features = [
  { icon: '💬', title: 'AI Study Chat', desc: 'Ask anything. Get RAG-powered answers pulled directly from your PDF — no hallucinations.' },
  { icon: '📝', title: 'Smart Quiz Engine', desc: 'Auto-generated MCQs with 30s timer, difficulty levels, and weak area analysis.' },
  { icon: '⚡', title: 'Instant Cheat Sheet', desc: 'Condense any PDF into a crisp summary with key concepts, formulas, and quick facts.' },
  { icon: '🔮', title: 'Exam Predictor', desc: 'AI analyzes your material and predicts the most likely exam questions with confidence scores.' },
  { icon: '🗂️', title: 'Flashcard Generator', desc: 'Auto-generated 3D flip cards from your cheat sheet for active recall study sessions.' },
  { icon: '🤝', title: 'Squad Study', desc: 'Real-time collaborative study rooms. See friends online, share AI answers, study together.' },
  { icon: '🎙️', title: 'Tutor Podcast', desc: 'AI generates a host + professor conversation from your PDF. Listen with speed control.' },
  { icon: '🌌', title: 'Brain Galaxy', desc: 'See all your documents as an animated knowledge graph. Click any planet to study.' },
  { icon: '🔭', title: 'Professor Lens', desc: 'Paste text from any source — textbooks, whiteboards, notes — and AI explains it simply.' },
  { icon: '🚨', title: 'Panic Mode', desc: 'Last-minute cramming? AI builds a minute-by-minute study plan with live countdown timers.' },
  { icon: '🎮', title: 'Study RPG', desc: 'Earn XP for every quiz, study session, and AI interaction. Level up from Novice to Legend.' },
  { icon: '📊', title: 'Revision Loop', desc: 'Quiz results identify weak spots. One-click "Revise" button jumps to targeted AI study.' },
]

const steps = [
  {
    num: '01', icon: '📄',
    title: 'Upload your PDF',
    desc: 'Drop any textbook, lecture notes, or study material. We support any PDF up to 50MB.',
    tag: 'Takes 5 seconds',
    accent: '#7c3aed',
    preview: (
      <div className="step-preview upload-preview">
        <div className="upload-zone">
          <span className="upload-icon-big">📄</span>
          <p className="upload-text">Drop your PDF here</p>
          <div className="upload-bar"><div className="upload-fill" /></div>
          <span className="upload-size">Data Structures.pdf · 4.2 MB</span>
        </div>
      </div>
    ),
  },
  {
    num: '02', icon: '🧠',
    title: '9 AI agents activate',
    desc: 'LearnLens chunks your document and powers up 9 specialized AI agents — from quiz generators to podcast scriptwriters.',
    tag: 'Powered by Groq + Llama 3.3 70B',
    accent: '#9333ea',
    preview: (
      <div className="step-preview process-preview">
        <div className="process-row"><span className="process-dot active" /><span className="process-label">Chat Agent ready</span><span className="process-check">✓</span></div>
        <div className="process-row"><span className="process-dot active" /><span className="process-label">Quiz Agent ready</span><span className="process-check">✓</span></div>
        <div className="process-row"><span className="process-dot active" /><span className="process-label">Podcast Agent ready</span><span className="process-check">✓</span></div>
        <div className="process-row"><span className="process-dot pulse" /><span className="process-label">Panic Agent initializing</span><span className="process-spin">⏳</span></div>
      </div>
    ),
  },
  {
    num: '03', icon: '💬',
    title: 'Study, quiz, listen, collaborate',
    desc: 'Chat with your PDF, take timed quizzes, listen to AI podcasts, study with friends in real-time, or enter Panic Mode.',
    tag: '11 pages, infinite learning',
    accent: '#a855f7',
    preview: (
      <div className="step-preview chat-preview">
        <div className="mini-bubble user">What is Big O notation?</div>
        <div className="mini-bubble ai">Big O notation describes the upper bound of an algorithm's time complexity. From your notes: O(1) is constant, O(n) linear...</div>
        <div className="mini-source">📎 Page 12 · RAG-powered</div>
      </div>
    ),
  },
  {
    num: '04', icon: '🎯',
    title: 'Level up & ace your exam',
    desc: 'Earn XP, unlock badges, review weak areas with the revision loop, and walk into your exam fully prepared.',
    tag: 'Exam-ready in minutes',
    accent: '#c026d3',
    preview: (
      <div className="step-preview test-preview">
        <div className="test-row"><span className="test-icon">📝</span><span>Smart Quiz · 20 MCQs</span><span className="test-badge green">85%</span></div>
        <div className="test-row"><span className="test-icon">🎮</span><span>XP Earned</span><span className="test-badge purple">+120</span></div>
        <div className="test-row"><span className="test-icon">🏆</span><span>Level Up!</span><span className="test-badge blue">Scholar</span></div>
      </div>
    ),
  },
]

const heroStats = [
  { value: '9', label: 'AI Agents' },
  { value: '11', label: 'Pages' },
  { value: '100%', label: 'Free' },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="ll-root">
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />

      {/* Navbar */}
      <nav className={`ll-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">LearnLens</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How it works</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="github-btn">
              <GitHubIcon /> Open Source
            </a>
            <Link to="/auth" className="cta-small">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="badge"><span className="badge-dot" /> ITS-A-Hack 2.0 · EdTech Track · 9 AI Agents</div>
        <h1 className="hero-title">Study smarter,<br /><span className="hero-accent">exam ready.</span></h1>
        <p className="hero-sub">Upload any PDF and 9 AI agents transform it into quizzes, podcasts, flashcards, cheat sheets, and study rooms — all from your own material.</p>
        <div className="hero-btns">
          <Link to="/auth" className="primary-btn">Start Learning Free →</Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="secondary-btn">
            <GitHubIcon size={18} /> View on GitHub
          </a>
        </div>
        <p className="hero-note">No credit card · No signup friction · Open source forever</p>
        <div className="hero-card">
          <div className="card-header">
            <div className="card-dots">
              <span className="dot" style={{ background: '#ff6b6b' }} />
              <span className="dot" style={{ background: '#ffd93d' }} />
              <span className="dot" style={{ background: '#6bcb77' }} />
            </div>
            <span className="card-title">LearnLens — AI Study Platform</span>
          </div>
          <div className="card-body">
            <div className="chip-row">
              <span className="chip">💬 Chat</span>
              <span className="chip">📝 Quiz</span>
              <span className="chip">⚡ Cheat Sheet</span>
              <span className="chip">🔮 Predictor</span>
              <span className="chip">🗂️ Flashcards</span>
            </div>
            <div className="chip-row">
              <span className="chip">🤝 Squad Study</span>
              <span className="chip">🎙️ Podcast</span>
              <span className="chip">🌌 Galaxy</span>
              <span className="chip">🔭 Lens</span>
              <span className="chip">🚨 Panic Mode</span>
              <span className="chip">🎮 RPG</span>
            </div>
            <div className="hero-stat-row">
              {heroStats.map((s, i) => (
                <div key={i} className="hero-stat"><span className="hero-stat-val">{s.value}</span><span className="hero-stat-lbl">{s.label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="ll-section" id="features">
        <p className="section-label">12 Features</p>
        <h2 className="section-title">Everything you need to ace your exam</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="hiw-section" id="how">
        <div className="hiw-inner">
          <p className="section-label">Simple process</p>
          <h2 className="section-title">From PDF to exam-ready<br /><span className="hero-accent">in 4 steps</span></h2>

          <div className="hiw-layout">
            <div className="hiw-steps">
              {steps.map((s, i) => (
                <button key={i} className={`hiw-step-btn ${activeStep === i ? 'active' : ''}`} onClick={() => setActiveStep(i)}>
                  <div className="hiw-step-num-wrap">
                    <span className="hiw-step-num" style={{ color: activeStep === i ? s.accent : undefined }}>{s.num}</span>
                    {i < steps.length - 1 && <span className="hiw-connector" />}
                  </div>
                  <div className="hiw-step-body">
                    <div className="hiw-step-header">
                      <span className="hiw-step-icon">{s.icon}</span>
                      <h3 className="hiw-step-title">{s.title}</h3>
                    </div>
                    <p className="hiw-step-desc">{s.desc}</p>
                    <span className="hiw-step-tag">{s.tag}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hiw-preview-panel">
              <div className="hiw-preview-bg" />
              <div className="hiw-preview-header">
                <div className="hiw-dots">
                  <span className="hiw-dot" style={{ background: '#ff6b6b' }} />
                  <span className="hiw-dot" style={{ background: '#ffd93d' }} />
                  <span className="hiw-dot" style={{ background: '#6bcb77' }} />
                </div>
                <span className="hiw-preview-title">LearnLens — Step {activeStep + 1} of 4</span>
              </div>
              <div className="hiw-preview-content">
                {steps.map((s, i) => (
                  <div key={i} className={`hiw-preview-slide ${activeStep === i ? 'visible' : ''}`}>{s.preview}</div>
                ))}
              </div>
              <div className="hiw-progress-dots">
                {steps.map((_, i) => (
                  <button key={i} className={`hiw-prog-dot ${activeStep === i ? 'active' : ''}`} onClick={() => setActiveStep(i)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE ── */}
      <section className="os-section">
        <div className="os-glow" />
        <div className="os-grid-pattern" />
        <div className="os-container">
          <div className="os-badge">
            <span className="os-badge-icon">🌟</span>
            <span>Open Source</span>
          </div>
          <h2 className="os-heading">Built in the open.<br /><span className="os-heading-accent">Owned by everyone.</span></h2>
          <p className="os-subtext">LearnLens is free and open source forever. Built by students, for students. Fork it, self-host it, shape it — it belongs to the community.</p>
          <div className="os-stats">
            <div className="os-stat-card"><span className="os-stat-icon">📜</span><span className="os-stat-value">MIT</span><span className="os-stat-label">License</span></div>
            <div className="os-stat-card"><span className="os-stat-icon">🔓</span><span className="os-stat-value">Free</span><span className="os-stat-label">Always</span></div>
            <div className="os-stat-card"><span className="os-stat-icon">🛠️</span><span className="os-stat-value">Yes</span><span className="os-stat-label">Self-hostable</span></div>
            <div className="os-stat-card"><span className="os-stat-icon">💜</span><span className="os-stat-value">Open</span><span className="os-stat-label">Community</span></div>
          </div>
          <div className="os-code-card">
            <div className="os-code-header">
              <div className="os-code-dots"><span style={{ background: '#ff6b6b' }} /><span style={{ background: '#ffd93d' }} /><span style={{ background: '#6bcb77' }} /></div>
              <span className="os-code-label">bash</span>
            </div>
            <div className="os-code-body">
              <span className="os-code-comment"># Clone and run locally in seconds</span>
              <span><span className="os-code-cmd">git clone</span> https://github.com/JexanJoel/LearnLens</span>
              <span><span className="os-code-cmd">cd</span> LearnLens &amp;&amp; <span className="os-code-cmd">npm install</span></span>
              <span><span className="os-code-cmd">npm run dev</span></span>
            </div>
          </div>
          <div className="os-actions">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="os-primary-btn">
              <GitHubIcon size={18} /> <span>Star on GitHub</span>
            </a>
          </div>
          <p className="os-mit">Released under the MIT License · Free forever</p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to study smarter?</h2>
        <p className="cta-sub">Upload your first PDF and let 9 AI agents do the heavy lifting.</p>
        <Link to="/auth" className="primary-btn">Get Started for Free →</Link>
      </section>

      {/* Footer */}
      <footer className="ll-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">LearnLens</span></div>
            <p className="footer-note">Built for ITS-A-Hack 2.0 · EdTech Track</p>
            <p className="footer-mit">MIT License · Free forever</p>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="github-btn">
            <GitHubIcon /> GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}