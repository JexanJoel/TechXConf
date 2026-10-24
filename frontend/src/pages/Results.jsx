import confetti from 'canvas-confetti'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [tab, setTab] = useState('all')
  const [ringPct, setRingPct] = useState(0)

  useEffect(() => {
    if (!state) {
      navigate(`/study/${id}`)
      return
    }

    const score = state.score || 0
    const total = state.total || 1
    const target = Math.round((score / total) * 100)
    
    // Confetti for high scores
    if (target >= 80) {
      const colors = ['#7c3aed', '#a855f7', '#6366f1', '#fbbf24']
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      })
    }

    let startTimestamp = null
    const duration = 1200 // 1.2 seconds

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Easing function: easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4)
      
      setRingPct(Math.round(ease * target))
      
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [state, navigate, id])

  if (!state) return null

  const { answers = [], score = 0, total = 0, pdf_name = '' } = state
  const pct = Math.round((score / total) * 100)
  const wrong = total - score
  const correctList = answers.filter(a => a.correct)
  const wrongList = answers.filter(a => !a.correct)

  const topicMap = {}
  wrongList.forEach(a => {
    topicMap[a.topic] = (topicMap[a.topic] || 0) + 1
  })
  const weakTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1])

  const grade = pct >= 90 ? { label: 'Excellent', color: '#10b981', icon: '🏆', msg: 'Mastery achieved! Outstanding work.' }
    : pct >= 75 ? { label: 'Great Job', color: '#3b82f6', icon: '🎉', msg: 'You have a very strong grasp of this.' }
    : pct >= 60 ? { label: 'Good', color: '#f59e0b', icon: '👍', msg: 'Decent work - a bit more study will help.' }
    : pct >= 40 ? { label: 'Needs Work', color: '#f97316', icon: '📚', msg: 'Review the material and try again.' }
    : { label: 'Keep Going', color: '#ef4444', icon: '💪', msg: 'Don’t discourage, persistence pays off.' }

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (ringPct / 100) * circumference

  const displayList = tab === 'correct' ? correctList : tab === 'wrong' ? wrongList : answers

  return (
    <div className="rs-light-root">
      {/* Header */}
      <header className="rs-header">
        <div className="rs-header-inner">
          <div className="rs-brand" onClick={() => navigate('/')}>
            <span className="rs-brand-icon">📚</span>
            <span className="rs-brand-text">LearnLens</span>
          </div>
          <div className="rs-header-right">
            <button className="rs-nav-btn outline" onClick={() => navigate(`/study/${id}`)}>Study Room</button>
            <button className="rs-nav-btn solid" onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
        </div>
      </header>

      <main className="rs-main">
        {/* Top Section: Score & Summary */}
        <section className="rs-hero-card">
          <div className="rs-hero-content">
            
            {/* Visual Score */}
            <div className="rs-score-viz">
              <div className="rs-ring-box">
                <svg className="rs-ring-svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" className="rs-ring-base" />
                  <circle
                    cx="60" cy="60" r="54"
                    className="rs-ring-progress"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    stroke="url(#rs-grad-light)"
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="rs-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="rs-ring-inner">
                  <span className="rs-ring-pct">{ringPct}%</span>
                  <span className="rs-ring-lbl">Score</span>
                </div>
              </div>
            </div>

            {/* Performance Text */}
            <div className="rs-performance">
              <div className="rs-grade-tag" style={{ color: grade.color, backgroundColor: `${grade.color}15`, borderColor: `${grade.color}30` }}>
                {grade.icon} {grade.label}
              </div>
              <h1 className="rs-summary-title">
                You scored <span className="rs-accent-text">{score}</span> out of <span className="rs-accent-text">{total}</span>
              </h1>
              <p className="rs-summary-msg">{grade.msg}</p>
              
              <div className="rs-quick-grid">
                <div className="rs-qstat">
                  <span className="rs-qstat-val correct">{score}</span>
                  <span className="rs-qstat-key">Correct</span>
                </div>
                <div className="rs-qstat">
                  <span className="rs-qstat-val wrong">{wrong}</span>
                  <span className="rs-qstat-key">Incorrect</span>
                </div>
                <div className="rs-qstat">
                  <span className="rs-qstat-val accuracy">{pct}%</span>
                  <span className="rs-qstat-key">Accuracy</span>
                </div>
              </div>

              <div className="rs-hero-btns">
                <button className="rs-action-btn primary" onClick={() => navigate(`/quiz/${id}`)}>
                  🔄 Retake Quiz
                </button>
                <button className="rs-action-btn secondary" onClick={() => navigate(`/study/${id}`)}>
                  💡 Back to Study
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="rs-page-grid">
          {/* Side Info */}
          <aside className="rs-side">
            {pdf_name && (
              <div className="rs-info-box">
                <div className="rs-box-head">
                  <span className="rs-box-icon">📄</span>
                  <h3>Reference Material</h3>
                </div>
                <p className="rs-pdf-name" title={pdf_name}>{pdf_name}</p>
              </div>
            )}

            {weakTopics.length > 0 && (
              <div className="rs-info-box weak-box">
                <div className="rs-box-head">
                  <span className="rs-box-icon">🎯</span>
                  <h3>Areas for Revision</h3>
                </div>
                <p className="rs-box-sub">Topics with most incorrect answers</p>
                <div className="rs-weak-list">
                  {weakTopics.map(([topic, count], i) => (
                    <div key={i} className="rs-weak-row">
                      <div className="rs-weak-meta">
                        <span className="rs-weak-topic">{topic}</span>
                        <button 
                          className="rs-revise-mini"
                          onClick={() => navigate(`/study/${id}?q=Can you explain ${topic} in detail based on the document?`)}
                        >
                          Revise
                        </button>
                      </div>
                      <div className="rs-weak-bar-bg">
                        <div className="rs-weak-bar-fill" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main List */}
          <article className="rs-reviews">
            <div className="rs-review-head">
              <h2>Answer Review</h2>
              <div className="rs-filters">
                {[
                  { key: 'all', label: 'All', count: total },
                  { key: 'correct', label: 'Correct', count: score },
                  { key: 'wrong', label: 'Wrong', count: wrong },
                ].map(f => (
                  <button
                    key={f.key}
                    className={`rs-filter-btn ${tab === f.key ? 'active' : ''}`}
                    onClick={() => setTab(f.key)}
                  >
                    {f.label} <span className="rs-fcount">{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rs-q-list">
              {displayList.length === 0 ? (
                <div className="rs-none">
                  <span className="rs-none-emoji">✨</span>
                  <p>No answers to show here.</p>
                </div>
              ) : displayList.map((a, i) => {
                const qNum = answers.indexOf(a) + 1
                return (
                  <div key={i} className={`rs-q-card ${a.correct ? 'pass' : 'fail'}`}>
                    <div className="rs-q-meta">
                      <span className="rs-q-index">Question {qNum}</span>
                      <span className="rs-q-topic">#{a.topic}</span>
                    </div>
                    <h3 className="rs-q-txt">{a.question}</h3>
                    <div className="rs-q-ans-grid">
                      <div className={`rs-ans-box ${a.correct ? 'pass' : 'fail'}`}>
                        <span className="rs-ans-lbl">{a.correct ? '✓ Your Answer' : '✗ Your Answer'}</span>
                        <p className="rs-ans-val">{a.selected?.replace(/^[A-D]\)\s*/, '') || 'Not answered'}</p>
                      </div>
                      {!a.correct && (
                        <div className="rs-ans-box pass">
                          <span className="rs-ans-lbl">✓ Correct Answer</span>
                          <p className="rs-ans-val">{a.answer?.replace(/^[A-D]\)\s*/, '')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}