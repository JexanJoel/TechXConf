import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './ProfLens.css'

export default function ProfLens() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [mode, setMode] = useState('text')
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)
      }
    } catch {
      setError('Unable to access camera. Try using the "Paste Text" mode instead.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(t => t.stop())
    setStreaming(false)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCaptured(dataUrl)
    stopCamera()
  }

  const analyzeImage = async () => {
    if (!captured) return
    setLoading(true); setError('')
    try {
      const res = await api.post('/study/lens', { image: captured })
      setExtractedText(res.data.text || '')
      setExplanation(res.data.explanation || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze.')
    }
    setLoading(false)
  }

  const analyzeText = async () => {
    if (!pastedText.trim()) return
    setLoading(true); setError('')
    try {
      const res = await api.post('/study/lens', { image: pastedText.trim() })
      setExtractedText(res.data.text || '')
      setExplanation(res.data.explanation || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze.')
    }
    setLoading(false)
  }

  const reset = () => {
    setCaptured(null); setPastedText(''); setExtractedText(''); setExplanation(''); setError('')
  }

  return (
    <div className="pl-root">
      <header className="pl-header">
        <div className="pl-header-inner">
          <div className="pl-brand" onClick={() => navigate('/')}>
            <span>📚</span><span className="pl-brand-text">LearnLens</span>
          </div>
          <button className="pl-back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        </div>
      </header>

      <main className="pl-main">
        <div className="pl-title-area">
          <h1>🔭 Professor Lens</h1>
          <p>Paste any text from a textbook or capture with your camera. AI explains it instantly.</p>
          <div className="pl-mode-toggle">
            <button className={`pl-mode-btn ${mode === 'text' ? 'active' : ''}`} onClick={() => { setMode('text'); stopCamera() }}>
              📝 Paste Text
            </button>
            <button className={`pl-mode-btn ${mode === 'camera' ? 'active' : ''}`} onClick={() => setMode('camera')}>
              📷 Camera
            </button>
          </div>
        </div>

        <div className="pl-content-grid">
          <div className="pl-camera-card">
            {mode === 'text' ? (
              <>
                <textarea
                  className="pl-text-input"
                  placeholder="Paste or type text from your textbook, whiteboard, or notes here..."
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  rows={10}
                />
                <div className="pl-camera-controls">
                  <button className="pl-btn primary" onClick={analyzeText} disabled={!pastedText.trim() || loading}>
                    {loading ? <><div className="pl-btn-spinner" /> Analyzing...</> : '🤖 Explain This'}
                  </button>
                  <button className="pl-btn secondary" onClick={reset}>🔄 Clear</button>
                </div>
              </>
            ) : !captured ? (
              <>
                <div className="pl-camera-view">
                  <video ref={videoRef} className="pl-video" playsInline muted />
                  {!streaming && (
                    <div className="pl-camera-overlay">
                      <span>📷</span>
                      <p>Camera Preview</p>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="pl-camera-controls">
                  {!streaming ? (
                    <button className="pl-btn primary" onClick={startCamera}>📸 Start Camera</button>
                  ) : (
                    <>
                      <button className="pl-btn capture" onClick={capture}>⏺ Capture</button>
                      <button className="pl-btn secondary" onClick={stopCamera}>Stop</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="pl-captured-view">
                  <img src={captured} alt="Captured" className="pl-captured-img" />
                </div>
                <div className="pl-camera-controls">
                  <button className="pl-btn primary" onClick={analyzeImage} disabled={loading}>
                    {loading ? <><div className="pl-btn-spinner" /> Analyzing...</> : '🤖 Explain This'}
                  </button>
                  <button className="pl-btn secondary" onClick={reset}>🔄 Retake</button>
                </div>
              </>
            )}
          </div>

          <div className="pl-results-card">
            {error && <p className="pl-error">{error}</p>}
            {extractedText ? (
              <>
                <div className="pl-result-section">
                  <h3>📝 Cleaned Text</h3>
                  <div className="pl-text-box">{extractedText}</div>
                </div>
                {explanation && (
                  <div className="pl-result-section">
                    <h3>💡 AI Explanation</h3>
                    <div className="pl-explanation-box">{explanation}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="pl-empty-result">
                <span>🔍</span>
                <p>Paste text or capture an image to get AI explanations</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
