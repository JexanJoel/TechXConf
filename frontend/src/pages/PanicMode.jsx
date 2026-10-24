import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './PanicMode.css'

export default function PanicMode() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pdfs, setPdfs] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [hours, setHours] = useState(2)

  // Plan
  const [plan, setPlan] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Timer
  const [activePhase, setActivePhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    init()
    return () => clearInterval(intervalRef.current)
  }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    const { data } = await supabase.from('pdfs').select('id, filename').eq('user_id', session.user.id)
    setPdfs(data || [])
    setLoading(false)
  }

  const generate = async () => {
    if (!selectedPdf) return
    setGenerating(true); setError('')
    try {
      const res = await api.post('/study/panic', { pdf_id: selectedPdf, hours })
      setPlan(res.data.plan)
      setActivePhase(0)
      if (res.data.plan?.phases?.[0]) {
        setTimeLeft(res.data.plan.phases[0].duration_minutes * 60)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate plan.')
    }
    setGenerating(false)
  }

  const startTimer = () => {
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          clearInterval(intervalRef.current)
          setIsRunning(false)
          const next = activePhase + 1
          if (plan?.phases?.[next]) {
            setActivePhase(next)
            setTimeLeft(plan.phases[next].duration_minutes * 60)
            // Play sound
            try { new Audio('data:audio/wav;base64,UklGRl9vT19teleVsbGVXQVZFZm10IA==').play() } catch {}
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => { clearInterval(intervalRef.current); setIsRunning(false) }
  const skipPhase = () => {
    clearInterval(intervalRef.current); setIsRunning(false)
    const next = activePhase + 1
    if (plan?.phases?.[next]) {
      setActivePhase(next)
      setTimeLeft(plan.phases[next].duration_minutes * 60)
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const phaseIcon = (type) => type === 'read' ? '📖' : type === 'quiz' ? '❓' : '🔄'

  if (loading) return <div className="pm-loader"><div className="pm-spinner" /><p>Loading...</p></div>

  return (
    <div className="pm-root">
      <header className="pm-header">
        <div className="pm-header-inner">
          <div className="pm-brand" onClick={() => navigate('/')}>
            <span>📚</span><span className="pm-brand-text">LearnLens</span>
          </div>
          <button className="pm-back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        </div>
      </header>

      <main className="pm-main">
        {!plan ? (
          <div className="pm-setup">
            <div className="pm-setup-hero">
              <span className="pm-alarm-icon">🚨</span>
              <h1>Panic Mode</h1>
              <p>Tell us how much time you have. We'll build the perfect last-minute study plan.</p>
            </div>

            <div className="pm-form-card">
              <div className="pm-field">
                <label>Select Document</label>
                <select value={selectedPdf || ''} onChange={e => setSelectedPdf(e.target.value)}>
                  <option value="">Choose a PDF...</option>
                  {pdfs.map(p => <option key={p.id} value={p.id}>{p.filename}</option>)}
                </select>
              </div>
              <div className="pm-field">
                <label>Hours Available</label>
                <div className="pm-hours-row">
                  {[1, 2, 3, 4, 6, 8].map(h => (
                    <button key={h} className={`pm-hour-btn ${hours === h ? 'active' : ''}`} onClick={() => setHours(h)}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="pm-error">{error}</p>}
              <button className="pm-go-btn" onClick={generate} disabled={!selectedPdf || generating}>
                {generating ? <><div className="pm-btn-spinner" /> Generating Plan...</> : '⚡ Generate Study Plan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="pm-active">
            <div className="pm-timer-card">
              <div className="pm-timer-top">
                <span className="pm-phase-badge">
                  {phaseIcon(plan.phases[activePhase]?.type)} {plan.phases[activePhase]?.title}
                </span>
                <span className="pm-phase-count">Phase {activePhase + 1} / {plan.phases.length}</span>
              </div>

              <div className="pm-timer-display">
                <span className={`pm-time ${timeLeft < 60 ? 'urgent' : ''}`}>{formatTime(timeLeft)}</span>
              </div>

              <div className="pm-timer-progress">
                <div className="pm-timer-bar">
                  <div className="pm-timer-fill" style={{
                    width: `${((plan.phases[activePhase]?.duration_minutes * 60 - timeLeft) /
                      (plan.phases[activePhase]?.duration_minutes * 60)) * 100}%`
                  }} />
                </div>
              </div>

              <div className="pm-timer-controls">
                <button className="pm-ctrl" onClick={isRunning ? pauseTimer : startTimer}>
                  {isRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button className="pm-ctrl secondary" onClick={skipPhase}
                  disabled={activePhase >= plan.phases.length - 1}>
                  ⏭ Skip Phase
                </button>
              </div>

              {plan.phases[activePhase]?.content && (
                <div className="pm-phase-content">
                  <p>{plan.phases[activePhase].content}</p>
                </div>
              )}

              {plan.phases[activePhase]?.key_points && (
                <ul className="pm-key-points">
                  {plan.phases[activePhase].key_points.map((kp, i) => (
                    <li key={i}>{kp}</li>
                  ))}
                </ul>
              )}

              {plan.phases[activePhase]?.questions && (
                <div className="pm-questions">
                  <h4>Quick Quiz</h4>
                  {plan.phases[activePhase].questions.map((q, i) => (
                    <p key={i} className="pm-quiz-q">💡 {q}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="pm-phases-sidebar">
              <h3>📋 Study Timeline</h3>
              {plan.phases.map((phase, i) => (
                <div key={i} className={`pm-phase-row ${i === activePhase ? 'active' : ''} ${i < activePhase ? 'done' : ''}`}
                  onClick={() => { clearInterval(intervalRef.current); setIsRunning(false); setActivePhase(i); setTimeLeft(phase.duration_minutes * 60) }}>
                  <span className="pm-phase-icon">{phaseIcon(phase.type)}</span>
                  <div className="pm-phase-info">
                    <span className="pm-phase-name">{phase.title}</span>
                    <span className="pm-phase-dur">{phase.duration_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
