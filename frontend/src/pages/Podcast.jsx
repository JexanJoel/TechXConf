import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './Podcast.css'

export default function Podcast() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pdf, setPdf] = useState(null)
  const [script, setScript] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const utterRef = useRef(null)

  useEffect(() => {
    init()
    return () => { window.speechSynthesis.cancel() }
  }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    try {
      const { data } = await supabase.from('pdfs').select('*').eq('id', id).single()
      setPdf(data)
    } catch { navigate('/dashboard') }
    setLoading(false)
  }

  const generateScript = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await api.post('/study/podcast', { pdf_id: id })
      setScript(res.data.script)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate podcast script.')
    }
    setGenerating(false)
  }

  const speak = (idx) => {
    if (!script?.segments) return
    window.speechSynthesis.cancel()

    if (idx >= script.segments.length) {
      setIsPlaying(false)
      setCurrentIdx(0)
      setProgress(100)
      return
    }

    setCurrentIdx(idx)
    setProgress(Math.round((idx / script.segments.length) * 100))

    const seg = script.segments[idx]
    const utter = new SpeechSynthesisUtterance(seg.text)
    utter.rate = speed
    utter.pitch = seg.speaker === 'host' ? 1.0 : 1.15
    utter.onend = () => speak(idx + 1)
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
    setIsPlaying(true)
  }

  const play = () => speak(currentIdx)
  const pause = () => { window.speechSynthesis.cancel(); setIsPlaying(false) }
  const skip = () => { window.speechSynthesis.cancel(); speak(currentIdx + 1) }
  const restart = () => { window.speechSynthesis.cancel(); setCurrentIdx(0); setProgress(0); speak(0) }

  if (loading) return <div className="pc-loader"><div className="pc-spinner" /><p>Loading...</p></div>

  return (
    <div className="pc-root">
      <header className="pc-header">
        <div className="pc-header-inner">
          <div className="pc-brand" onClick={() => navigate('/')}>
            <span>📚</span><span className="pc-brand-text">LearnLens</span>
          </div>
          <div className="pc-header-right">
            <button className="pc-nav-btn outline" onClick={() => navigate(`/study/${id}`)}>Study Room</button>
            <button className="pc-nav-btn solid" onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
        </div>
      </header>

      <main className="pc-main">
        {!script ? (
          <div className="pc-empty">
            <div className="pc-empty-visual">
              <span className="pc-mic-icon">🎙️</span>
              <div className="pc-wave-bars">
                {[...Array(12)].map((_, i) => <div key={i} className="pc-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            </div>
            <h1>Tutor Podcast</h1>
            <p>Transform your study material into an AI-narrated audio experience</p>
            {pdf && <span className="pc-doc-badge">📄 {pdf.filename}</span>}
            {error && <p className="pc-error">{error}</p>}
            <button className="pc-generate-btn" onClick={generateScript} disabled={generating}>
              {generating ? <><div className="pc-btn-spinner" /> Generating Script...</> : '✨ Generate Podcast'}
            </button>
          </div>
        ) : (
          <div className="pc-player-wrap">
            <div className="pc-player-card">
              <div className="pc-player-art">
                <span>🎙️</span>
              </div>
              <div className="pc-player-info">
                <h2>{script.title || pdf?.filename}</h2>
                <p>{script.segments?.length || 0} segments · AI Generated</p>
              </div>

              <div className="pc-progress-wrap">
                <div className="pc-progress-bar">
                  <div className="pc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="pc-progress-labels">
                  <span>Segment {currentIdx + 1} / {script.segments?.length || 0}</span>
                  <span>{speed}x speed</span>
                </div>
              </div>

              <div className="pc-controls">
                <button className="pc-ctrl-btn" onClick={restart} title="Restart">⏮</button>
                <button className="pc-ctrl-btn play" onClick={isPlaying ? pause : play}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="pc-ctrl-btn" onClick={skip} title="Skip">⏭</button>
              </div>

              <div className="pc-speed-row">
                {[0.75, 1, 1.25, 1.5, 2].map(s => (
                  <button
                    key={s}
                    className={`pc-speed-btn ${speed === s ? 'active' : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="pc-script-list">
              <h3>📜 Script</h3>
              {script.segments?.map((seg, i) => (
                <div
                  key={i}
                  className={`pc-seg ${i === currentIdx && isPlaying ? 'active' : ''} ${i < currentIdx ? 'done' : ''}`}
                  onClick={() => { window.speechSynthesis.cancel(); speak(i) }}
                >
                  <span className="pc-seg-speaker">{seg.speaker === 'host' ? '🎤' : '📖'}</span>
                  <p>{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
