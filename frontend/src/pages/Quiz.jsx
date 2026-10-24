import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './Quiz.css'

export default function Quiz() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase] = useState('loading')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => { checkUser() }, [])

  // Timer Effect
  useEffect(() => {
    if (timerActive && timeLeft > 0 && !revealed) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    if (timeLeft === 0 && timerActive && !revealed) {
      handleTimeOut()
    }

    return () => clearInterval(timerRef.current)
  }, [timerActive, timeLeft, revealed])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    setUser(session.user)
    fetchPDF()
  }

  const fetchPDF = async () => {
    try {
      const { data, error } = await supabase.from('pdfs').select('*').eq('id', id).single()
      if (error) throw error
      setPdf(data)
      setPhase('config')
    } catch { navigate('/dashboard') }
  }

  const startQuiz = async () => {
    setPhase('loading')
    setError('')
    try {
      const res = await api.post('/quiz/generate', { 
        pdf_id: id, 
        count,
        difficulty // Pass difficulty to backend
      })
      setQuestions(res.data.questions)
      setCurrent(0)
      setSelected(null)
      setRevealed(false)
      setAnswers([])
      setPhase('quiz')
      resetTimer()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz. Try again.')
      setPhase('config')
    }
  }

  const resetTimer = () => {
    setTimeLeft(30)
    setTimerActive(true)
  }

  const handleTimeOut = () => {
    setRevealed(true)
    setSelected('TIMEOUT') // Special marker for timeout
  }

  const handleSelect = (option) => {
    if (revealed) return
    setSelected(option)
    setRevealed(true)
    setTimerActive(false)
  }

  const handleNext = async () => {
    const q = questions[current]
    const isCorrect = selected === q.answer
    const newAnswers = [...answers, {
      question: q.question,
      topic: q.topic,
      selected,
      answer: q.answer,
      correct: isCorrect,
      timedOut: selected === 'TIMEOUT'
    }]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
      setSelected(null)
      setRevealed(false)
      resetTimer()
    } else {
      setPhase('submitting')
      setTimerActive(false)
      try {
        const score = newAnswers.filter(a => a.correct).length
        const res = await api.post('/quiz/submit', {
          pdf_id: id,
          user_id: user.id,
          score,
          total: questions.length,
          answers: newAnswers
        })
        navigate(`/results/${id}`, {
          state: {
            answers: newAnswers,
            score,
            total: questions.length,
            weak_topics: res.data.weak_topics,
            pdf_name: pdf?.filename
          }
        })
      } catch {
        const score = newAnswers.filter(a => a.correct).length
        navigate(`/results/${id}`, {
          state: {
            answers: newAnswers,
            score,
            total: questions.length,
            weak_topics: [],
            pdf_name: pdf?.filename
          }
        })
      }
    }
  }

  const correctSoFar = answers.filter(a => a.correct).length
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0

  // ── Loader ──
  if (phase === 'loading' || phase === 'submitting') return (
    <div className="qz-loader">
      <div className="qz-loader-inner">
        <div className="qz-loader-ring" />
        <span className="qz-loader-emoji">📝</span>
      </div>
      <p>{phase === 'submitting' ? 'Analysing your results...' : 'Crafting your quiz...'}</p>
      <span>{phase === 'submitting' ? 'Identifying weak areas' : 'AI is reading your document'}</span>
    </div>
  )

  // ── Config ──
  if (phase === 'config') return (
    <div className="qz-config-root">
      <div className="qz-config-left">
        <div className="qz-config-brand" onClick={() => navigate('/')}>
          📚 <span>LearnLens</span>
        </div>
        <div className="qz-config-left-body">
          <div className="qz-config-glyph">📝</div>
          <h1 className="qz-config-headline">Test your knowledge</h1>
          <p className="qz-config-desc">
            AI-generated questions strictly from <strong>{pdf?.filename}</strong>
          </p>
          <div className="qz-config-features">
            {[
              { icon: '🎯', label: 'Targeted MCQs', desc: 'Based on your document' },
              { icon: '⚡', label: 'Instant feedback', desc: 'See answers right away' },
              { icon: '⏱️', label: 'Timed Challenge', desc: 'Beat the 30s clock' },
            ].map((f, i) => (
              <div key={i} className="qz-config-feature">
                <div className="qz-config-feature-icon">{f.icon}</div>
                <div>
                  <p className="qz-config-feature-label">{f.label}</p>
                  <p className="qz-config-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="qz-config-right">
        <button className="qz-back-btn" onClick={() => navigate(`/study/${id}`)}>
          ← Back to Study Room
        </button>

        <div className="qz-config-card">
          <h2 className="qz-config-card-title">Configure your quiz</h2>

          {error && <div className="qz-error">{error}</div>}

          <div className="qz-field">
            <label className="qz-field-label">Number of questions</label>
            <div className="qz-count-grid">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  className={`qz-count-btn ${count === n ? 'active' : ''}`}
                  onClick={() => setCount(n)}
                >
                  <span className="qz-count-num">{n}</span>
                  <span className="qz-count-label">questions</span>
                </button>
              ))}
            </div>
          </div>

          <div className="qz-field">
            <label className="qz-field-label">Difficulty Level</label>
            <div className="qz-diff-grid">
              {[
                { id: 'basic', label: 'Basic', icon: '🌱' },
                { id: 'intermediate', label: 'Intermediate', icon: '🔥' },
                { id: 'advanced', label: 'Advanced', icon: '🧠' },
              ].map(d => (
                <button
                  key={d.id}
                  className={`qz-diff-btn ${difficulty === d.id ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="qz-summary-row">
            <div className="qz-summary-item">
              <span className="qz-summary-val">{count}</span>
              <span className="qz-summary-key">Questions</span>
            </div>
            <div className="qz-summary-divider" />
            <div className="qz-summary-item">
              <span className="qz-summary-val">{difficulty[0].toUpperCase() + difficulty.slice(1)}</span>
              <span className="qz-summary-key">Level</span>
            </div>
            <div className="qz-summary-divider" />
            <div className="qz-summary-item">
              <span className="qz-summary-val">30s</span>
              <span className="qz-summary-key">Timer</span>
            </div>
          </div>

          <button className="qz-start-btn" onClick={startQuiz}>
            Start Quiz
            <span className="qz-start-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )

  // ── Quiz ──
  const q = questions[current]

  return (
    <div className="qz-root">

      {/* Header */}
      <header className="qz-header">
        <div className="qz-header-brand" onClick={() => navigate('/dashboard')}>
          📚 <span>LearnLens</span>
        </div>

        <div className="qz-header-mid">
          <div className="qz-prog-track">
            <div className="qz-prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="qz-prog-meta">
            <span>{current + 1} of {questions.length}</span>
            <div className={`qz-timer ${timeLeft <= 5 ? 'urgent' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
            <span>{correctSoFar} correct</span>
          </div>
        </div>

        <button className="qz-exit-btn" onClick={() => navigate(`/study/${id}`)}>
          ✕ Exit
        </button>
      </header>

      {/* Body */}
      <div className="qz-body">

        {/* Left — tracker */}
        <aside className="qz-aside">
          <p className="qz-aside-label">Progress</p>
          <div className="qz-dots">
            {questions.map((_, i) => {
              let cls = 'empty'
              if (i < answers.length) cls = answers[i].correct ? 'correct' : 'wrong'
              else if (i === current) cls = 'active'
              return <div key={i} className={`qz-dot ${cls}`}><span>{i + 1}</span></div>
            })}
          </div>
          <div className="qz-aside-score">
            <div className="qz-aside-score-circle">
              <span className="qz-aside-score-num">{correctSoFar}</span>
              <span className="qz-aside-score-den">/{answers.length || '–'}</span>
            </div>
            <p className="qz-aside-score-label">Correct so far</p>
          </div>
        </aside>

        {/* Center — question */}
        <div className="qz-center">
          <div className="qz-card" key={current}>
            <div className="qz-card-meta">
              <span className="qz-topic">{q.topic}</span>
              <span className="qz-counter">Q{current + 1}</span>
            </div>

            <h2 className="qz-question">{q.question}</h2>

            <div className="qz-options">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const cleanOpt = opt.replace(/^[A-D]\)\s*/, '')
                let state = 'idle'
                if (revealed) {
                  if (opt === q.answer) state = 'correct'
                  else if (opt === selected) state = 'wrong'
                  else state = 'dim'
                } else if (selected === opt) {
                  state = 'selected'
                }
                return (
                  <button
                    key={i}
                    className={`qz-opt qz-opt-${state}`}
                    onClick={() => handleSelect(opt)}
                    disabled={revealed}
                  >
                    <span className="qz-opt-letter">{letter}</span>
                    <span className="qz-opt-text">{cleanOpt}</span>
                    {revealed && opt === q.answer && <span className="qz-opt-icon">✓</span>}
                    {revealed && opt === selected && opt !== q.answer && <span className="qz-opt-icon">✗</span>}
                  </button>
                )
              })}
            </div>

            {revealed && (
              <div className={`qz-verdict ${selected === q.answer ? 'pass' : (selected === 'TIMEOUT' ? 'timeout' : 'fail')}`}>
                <span className="qz-verdict-icon">{selected === q.answer ? '🎉' : (selected === 'TIMEOUT' ? '⏰' : '💡')}</span>
                <div>
                  <p className="qz-verdict-title">
                    {selected === q.answer ? 'Correct!' : (selected === 'TIMEOUT' ? "Time's Up!" : 'Not quite')}
                  </p>
                  <p className="qz-verdict-ans">
                    {selected === 'TIMEOUT' ? 'You ran out of time. ' : ''}
                    Correct answer: <strong>{q.answer.replace(/^[A-D]\)\s*/, '')}</strong>
                  </p>
                </div>
              </div>
            )}

            <button
              className="qz-next"
              onClick={handleNext}
              disabled={!revealed}
            >
              {current + 1 === questions.length ? '🏁 Submit & See Results' : 'Next Question →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}