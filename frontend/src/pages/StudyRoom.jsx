import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './StudyRoom.css'

export default function StudyRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bottomRef = useRef()
  const inputRef = useRef()

  const [pdf, setPdf] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)

  // Chat
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I\'ve read your document. Ask me anything and I\'ll answer strictly from its content.' }
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Cheat Sheet
  const [cheatSheet, setCheatSheet] = useState(null)
  const [cheatLoading, setCheatLoading] = useState(false)
  const [cheatError, setCheatError] = useState('')

  // Exam Predictor
  const [predictions, setPredictions] = useState(null)
  const [predictLoading, setPredictLoading] = useState(false)
  const [predictError, setPredictError] = useState('')

  useEffect(() => { checkUser() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Handle auto-query from Results page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q && pdf && messages.length === 1 && !chatLoading) {
      // Small delay to ensure everything is ready
      setTimeout(() => {
        setInput(q)
        // We can't call sendMessage directly easily without it being in a ref or scope
        // but we can simulate the trigger if we refactor sendMessage or just set input
        // and let the user press enter, or trigger it here.
        // Let's refactor slightly to allow triggering.
      }, 500)
    }
  }, [pdf]) // Run once PDF is loaded

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    fetchPDF()
  }

  const fetchPDF = async () => {
    try {
      const { data, error } = await supabase.from('pdfs').select('*').eq('id', id).single()
      if (error) throw error
      setPdf(data)
    } catch { navigate('/dashboard') }
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setChatLoading(true)
    try {
      const history = messages.slice(1).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }))
      const res = await api.post('/chat', { pdf_id: id, question, history })
      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Something went wrong. Please try again.' }])
    }
    setChatLoading(false)
  }

  const generateCheatSheet = async () => {
    setCheatLoading(true)
    setCheatError('')
    try {
      const res = await api.post('/study/cheatsheet', { pdf_id: id })
      setCheatSheet(res.data.cheatsheet)
    } catch (err) {
      setCheatError(err.response?.data?.error || 'Failed to generate. Try again.')
    }
    setCheatLoading(false)
  }

  const generatePredictions = async () => {
    setPredictLoading(true)
    setPredictError('')
    try {
      const res = await api.post('/study/predict', { pdf_id: id })
      setPredictions(res.data.predictions)
    } catch (err) {
      setPredictError(err.response?.data?.error || 'Failed to generate. Try again.')
    }
    setPredictLoading(false)
  }

  // Flashcards
  const [flashcards, setFlashcards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (cheatSheet?.key_concepts) {
      // Create flashcards from key concepts: Topic: Description
      const cards = cheatSheet.key_concepts.map(c => {
        if (c.includes(':')) {
           const [q, ...a] = c.split(':')
           return { front: q.trim(), back: a.join(':').trim() }
        }
        return { front: 'Concept', back: c.trim() }
      })
      setFlashcards(cards)
    }
  }, [cheatSheet])

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCheatSheetMD = () => {
    if (!cheatSheet) return
    let md = `# ${cheatSheet.title || 'Cheat Sheet'}\n\n${cheatSheet.summary || ''}\n\n`
    if (cheatSheet.key_concepts?.length > 0) {
      md += `## 🧠 Key Concepts\n`
      cheatSheet.key_concepts.forEach(c => md += `- ${c}\n`)
      md += `\n`
    }
    if (cheatSheet.important_formulas?.length > 0) {
      md += `## 📐 Formulas\n`
      cheatSheet.important_formulas.forEach(f => md += `- ${f}\n`)
      md += `\n`
    }
    if (cheatSheet.quick_facts?.length > 0) {
      md += `## ⚡ Quick Facts\n`
      cheatSheet.quick_facts.forEach(f => md += `- ${f}\n`)
    }
    downloadFile(md, `${pdf?.filename?.replace('.pdf', '')}_CheatSheet.md`)
  }

  const exportPredictionsMD = () => {
    if (!predictions) return
    let md = `# Predicted Exam Questions: ${pdf?.filename || 'Document'}\n\n`
    predictions.forEach((p, i) => {
      md += `### ${i + 1}. ${p.question}\n`
      md += `- **Topic:** ${p.topic}\n`
      md += `- **Confidence:** ${p.confidence}%\n`
      md += `- **Reasoning:** ${p.reason}\n\n`
    })
    downloadFile(md, `${pdf?.filename?.replace('.pdf', '')}_Questions.md`)
  }

  useEffect(() => {
    if (activeTab === 'cheatsheet' && !cheatSheet && !cheatLoading) generateCheatSheet()
    if (activeTab === 'predictor' && !predictions && !predictLoading) generatePredictions()
  }, [activeTab])

  if (loading) return (
    <div className="sr-loader">
      <div className="sr-spinner" />
      <p>Loading study room...</p>
    </div>
  )

  return (
    <div className="sr-root">

      {/* ── Sidebar ── */}
      <aside className="sr-sidebar">
        <div className="sr-sidebar-top">
          <div className="sr-brand" onClick={() => navigate('/')}>
            <span>📚</span>
            <span className="sr-brand-text">LearnLens</span>
          </div>
          <button className="sr-back-btn" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
        </div>

        <div className="sr-doc-card">
          <div className="sr-doc-icon">📄</div>
          <div className="sr-doc-info">
            <p className="sr-doc-label">Document</p>
            <p className="sr-doc-name" title={pdf?.filename}>{pdf?.filename}</p>
          </div>
        </div>

        <nav className="sr-nav">
          {[
            { key: 'chat', icon: '💬', label: 'Chat', desc: 'Ask questions' },
            { key: 'cheatsheet', icon: '⚡', label: 'Cheat Sheet', desc: 'Key concepts' },
            { key: 'predictor', icon: '🔮', label: 'Exam Predictor', desc: 'Likely questions' },
            { key: 'flashcards', icon: '🗂️', label: 'Flashcards', desc: 'Test your memory' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`sr-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="sr-nav-icon">{tab.icon}</span>
              <div className="sr-nav-text">
                <span className="sr-nav-label">{tab.label}</span>
                <span className="sr-nav-desc">{tab.desc}</span>
              </div>
              {activeTab === tab.key && <span className="sr-nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sr-sidebar-bottom">
          <button className="sr-quiz-btn" onClick={() => navigate(`/quiz/${id}`)}>
            📝 Take Quiz
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="sr-main">

        {/* ── Chat ── */}
        {activeTab === 'chat' && (
          <div className="sr-chat-wrap">
            <div className="sr-chat-header">
              <div>
                <h1 className="sr-page-title">Chat with your document</h1>
                <p className="sr-page-sub">Ask anything — answers come strictly from your PDF</p>
              </div>
            </div>

            <div className="sr-messages">
              {messages.map((m, i) => (
                <div key={i} className={`sr-msg ${m.role}`}>
                  <div className="sr-avatar">{m.role === 'ai' ? '🤖' : '👤'}</div>
                  <div className="sr-bubble">{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="sr-msg ai">
                  <div className="sr-avatar">🤖</div>
                  <div className="sr-bubble sr-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="sr-input-wrap">
              <div className="sr-input-box">
                <input
                  ref={inputRef}
                  className="sr-input"
                  placeholder="Ask anything about your document..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button
                  className="sr-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || chatLoading}
                >
                  ➤
                </button>
              </div>
              <p className="sr-input-hint">Press Enter to send · Answers from your document only</p>
            </div>
          </div>
        )}

        {/* ── Cheat Sheet ── */}
        {activeTab === 'cheatsheet' && (
          <div className="sr-panel-wrap">
            <div className="sr-panel-head">
              <div>
                <h1 className="sr-page-title">⚡ Cheat Sheet</h1>
                <p className="sr-page-sub">AI-condensed summary of your entire document</p>
              </div>
              <div className="sr-panel-actions">
                {cheatSheet && (
                  <>
                    <button className="sr-export-btn" onClick={exportCheatSheetMD}>
                      📤 Export MD
                    </button>
                    <button className="sr-regen" onClick={() => { setCheatSheet(null); generateCheatSheet() }}>
                      🔄 Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>

            {cheatLoading ? <GeneratingState text="Generating your cheat sheet..." /> :
             cheatError ? <ErrorState msg={cheatError} onRetry={generateCheatSheet} /> :
             cheatSheet ? (
              <div className="sr-cs">
                <div className="sr-cs-hero">
                  <h2 className="sr-cs-title">{cheatSheet.title}</h2>
                  <p className="sr-cs-summary">{cheatSheet.summary}</p>
                </div>
                <div className="sr-cs-grid">
                  {cheatSheet.key_concepts?.length > 0 && (
                    <div className="sr-cs-card">
                      <div className="sr-cs-card-head">
                        <span className="sr-cs-card-icon">🧠</span>
                        <h3>Key Concepts</h3>
                      </div>
                      <ul className="sr-cs-list">
                        {cheatSheet.key_concepts.map((c, i) => (
                          <li key={i}><span className="sr-cs-bullet" />  {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cheatSheet.important_formulas?.length > 0 && (
                    <div className="sr-cs-card">
                      <div className="sr-cs-card-head">
                        <span className="sr-cs-card-icon">📐</span>
                        <h3>Formulas</h3>
                      </div>
                      <ul className="sr-cs-list">
                        {cheatSheet.important_formulas.map((f, i) => (
                          <li key={i} className="formula">{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cheatSheet.quick_facts?.length > 0 && (
                    <div className="sr-cs-card">
                      <div className="sr-cs-card-head">
                        <span className="sr-cs-card-icon">⚡</span>
                        <h3>Quick Facts</h3>
                      </div>
                      <ul className="sr-cs-list">
                        {cheatSheet.quick_facts.map((f, i) => (
                          <li key={i}><span className="sr-cs-bullet" />  {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Exam Predictor ── */}
        {activeTab === 'predictor' && (
          <div className="sr-panel-wrap">
            <div className="sr-panel-head">
              <div>
                <h1 className="sr-page-title">🔮 Exam Predictor</h1>
                <p className="sr-page-sub">AI-predicted questions based on your document's content</p>
              </div>
              <div className="sr-panel-actions">
                {predictions && (
                  <>
                    <button className="sr-export-btn" onClick={exportPredictionsMD}>
                      📤 Export MD
                    </button>
                    <button className="sr-regen" onClick={() => { setPredictions(null); generatePredictions() }}>
                      🔄 Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>

            {predictLoading ? <GeneratingState text="Predicting exam questions..." /> :
             predictError ? <ErrorState msg={predictError} onRetry={generatePredictions} /> :
             predictions ? (
              <div className="sr-pred-grid">
                {predictions.map((p, i) => (
                  <div key={i} className="sr-pred-card">
                    <div className="sr-pred-card-top">
                      <div className="sr-pred-left">
                        <span className="sr-pred-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="sr-pred-topic">{p.topic}</span>
                      </div>
                      <span className={`sr-pred-badge ${p.confidence >= 80 ? 'high' : p.confidence >= 65 ? 'mid' : 'low'}`}>
                        {p.confidence}%
                      </span>
                    </div>
                    <p className="sr-pred-q">{p.question}</p>
                    <div className="sr-pred-bar-wrap">
                      <div className="sr-pred-bar">
                        <div className="sr-pred-fill" style={{ width: `${p.confidence}%` }} />
                      </div>
                      <span className="sr-pred-pct">{p.confidence}% likely</span>
                    </div>
                    <div className="sr-pred-reason">
                      <span className="sr-pred-reason-icon">💡</span>
                      <p>{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Flashcards ── */}
        {activeTab === 'flashcards' && (
          <div className="sr-panel-wrap">
            <div className="sr-panel-head">
              <div>
                <h1 className="sr-page-title">🗂️ Study Flashcards</h1>
                <p className="sr-page-sub">Flip and learn key concepts from your document</p>
              </div>
            </div>

            {!cheatSheet ? (
              <div className="sr-empty-card">
                <span className="sr-flash-placeholder-icon">⚡</span>
                <p>Generate a Cheat Sheet first to create flashcards!</p>
                <button className="sr-quiz-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setActiveTab('cheatsheet')}>
                  Generate Now
                </button>
              </div>
            ) : flashcards.length === 0 ? (
              <div className="sr-empty-card">
                <p>No concepts found to create cards.</p>
              </div>
            ) : (
              <div className="sr-flash-wrap">
                <div className="sr-flash-progress">
                  <span>Card {currentCard + 1} of {flashcards.length}</span>
                  <div className="sr-flash-bar">
                    <div className="sr-flash-bar-fill" style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }} />
                  </div>
                </div>

                <div 
                  className={`sr-flash-card ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="sr-flash-inner">
                    <div className="sr-flash-front">
                      <span className="sr-flash-tag">FRONT</span>
                      <h3 className="sr-flash-text">{flashcards[currentCard].front}</h3>
                      <p className="sr-flash-hint">Click to flip 🔄</p>
                    </div>
                    <div className="sr-flash-back">
                      <span className="sr-flash-tag">BACK</span>
                      <p className="sr-flash-text">{flashcards[currentCard].back}</p>
                      <p className="sr-flash-hint">Click to flip 🔄</p>
                    </div>
                  </div>
                </div>

                <div className="sr-flash-btns">
                  <button 
                    disabled={currentCard === 0}
                    onClick={() => { setCurrentCard(c => c - 1); setIsFlipped(false); }}
                  >
                    ← Previous
                  </button>
                  <button 
                    disabled={currentCard === flashcards.length - 1}
                    onClick={() => { setCurrentCard(c => c + 1); setIsFlipped(false); }}
                    className="primary"
                  >
                    Next Card →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Mobile bottom nav */}
      <nav className="sr-mobile-nav">
        {[
          { key: 'chat', icon: '💬', label: 'Chat' },
          { key: 'cheatsheet', icon: '⚡', label: 'Cheat Sheet' },
          { key: 'predictor', icon: '🔮', label: 'Predictor' },
          { key: 'flashcards', icon: '🗂️', label: 'Flashcards' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`sr-mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <button className="sr-mobile-tab quiz" onClick={() => navigate(`/quiz/${id}`)}>
          <span>📝</span>
          <span>Quiz</span>
        </button>
      </nav>
    </div>
  )
}

function GeneratingState({ text }) {
  return (
    <div className="sr-generating">
      <div className="sr-gen-spinner" />
      <p>{text}</p>
      <span>This may take a few seconds</span>
    </div>
  )
}

function ErrorState({ msg, onRetry }) {
  return (
    <div className="sr-error">
      <div className="sr-error-icon">⚠️</div>
      <p>{msg}</p>
      <button className="sr-regen" onClick={onRetry}>Try Again</button>
    </div>
  )
}