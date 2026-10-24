import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './SquadStudy.css'

export default function SquadStudy() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bottomRef = useRef()

  const [user, setUser] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [inRoom, setInRoom] = useState(false)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => { init() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    setUser(session.user)
    try {
      const { data } = await supabase.from('pdfs').select('*').eq('id', id).single()
      setPdf(data)
    } catch { navigate('/dashboard') }
    setLoading(false)
  }

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
    joinRoom(code)
  }

  const joinRoom = (code) => {
    const c = code || joinCode.toUpperCase()
    if (!c || c.length < 4) return
    setRoomCode(c)

    const channel = supabase.channel(`squad-${c}`, {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online = Object.values(state).flat().map(p => ({
          id: p.user_id,
          email: p.email,
          color: p.color
        }))
        setMembers(online)
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
          await channel.track({
            user_id: user.id,
            email: user.email,
            color: colors[Math.floor(Math.random() * colors.length)],
            online_at: new Date().toISOString()
          })
        }
      })

    channelRef.current = channel
    setInRoom(true)
  }

  const sendMessage = async (isAI = false) => {
    if (!input.trim() || chatLoading) return
    const question = input.trim()
    setInput('')

    const userMsg = {
      role: 'user',
      content: question,
      sender: user.email,
      timestamp: Date.now()
    }

    channelRef.current?.send({ type: 'broadcast', event: 'message', payload: userMsg })
    setMessages(prev => [...prev, userMsg])

    if (isAI) {
      setChatLoading(true)
      try {
        const res = await api.post('/chat', { pdf_id: id, question, history: [] })
        const aiMsg = {
          role: 'ai',
          content: res.data.answer,
          sender: 'LearnLens AI',
          timestamp: Date.now()
        }
        channelRef.current?.send({ type: 'broadcast', event: 'message', payload: aiMsg })
        setMessages(prev => [...prev, aiMsg])
      } catch {
        const errMsg = { role: 'ai', content: '❌ AI failed to respond.', sender: 'System', timestamp: Date.now() }
        setMessages(prev => [...prev, errMsg])
      }
      setChatLoading(false)
    }
  }

  const leaveRoom = () => {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setInRoom(false)
    setMembers([])
    setMessages([])
    setRoomCode('')
  }

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  if (loading) return (
    <div className="sq-loader"><div className="sq-spinner" /><p>Loading...</p></div>
  )

  return (
    <div className="sq-root">
      <header className="sq-header">
        <div className="sq-header-inner">
          <div className="sq-brand" onClick={() => navigate('/')}>
            <span>📚</span><span className="sq-brand-text">LearnLens</span>
          </div>
          <div className="sq-header-right">
            <button className="sq-nav-btn outline" onClick={() => navigate(`/study/${id}`)}>Solo Study</button>
            <button className="sq-nav-btn solid" onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
        </div>
      </header>

      <main className="sq-main">
        {!inRoom ? (
          <div className="sq-lobby">
            <div className="sq-lobby-hero">
              <span className="sq-lobby-icon">🤝</span>
              <h1>Squad Study</h1>
              <p>Study together in real-time. Share AI answers, discuss concepts, and learn as a team.</p>
              {pdf && <span className="sq-doc-badge">📄 {pdf.filename}</span>}
            </div>

            <div className="sq-lobby-actions">
              <div className="sq-lobby-card">
                <h3>Create a Room</h3>
                <p>Start a new study session and invite friends</p>
                <button className="sq-btn primary" onClick={createRoom}>
                  ✨ Create Room
                </button>
              </div>

              <div className="sq-lobby-divider">
                <span>OR</span>
              </div>

              <div className="sq-lobby-card">
                <h3>Join a Room</h3>
                <p>Enter a room code from your study partner</p>
                <div className="sq-join-row">
                  <input
                    className="sq-code-input"
                    placeholder="ROOM CODE"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <button className="sq-btn secondary" onClick={() => joinRoom()} disabled={joinCode.length < 4}>
                    Join →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="sq-room">
            <div className="sq-room-top">
              <div className="sq-room-info">
                <h2>🔴 Live Session</h2>
                <div className="sq-room-code-box">
                  <span>Room: <strong>{roomCode}</strong></span>
                  <button className="sq-copy-btn" onClick={() => { navigator.clipboard.writeText(roomCode); }}>
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="sq-members">
                {members.map((m, i) => (
                  <div key={i} className="sq-member" title={m.email}>
                    <div className="sq-member-avatar" style={{ background: m.color }}>
                      {m.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="sq-member-dot" />
                  </div>
                ))}
                <span className="sq-member-count">{members.length} online</span>
              </div>
              <button className="sq-leave-btn" onClick={leaveRoom}>Leave Room</button>
            </div>

            <div className="sq-chat-area">
              <div className="sq-messages">
                <div className="sq-system-msg">
                  <span>🎉</span> Room <strong>{roomCode}</strong> is live! Share the code with your study partners.
                </div>
                {messages.map((m, i) => (
                  <div key={i} className={`sq-msg ${m.role}`}>
                    <div className="sq-msg-head">
                      <span className="sq-msg-sender">{m.role === 'ai' ? '🤖 AI' : m.sender?.split('@')[0]}</span>
                      <span className="sq-msg-time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="sq-msg-body">{m.content}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="sq-msg ai">
                    <div className="sq-msg-head"><span className="sq-msg-sender">🤖 AI</span></div>
                    <p className="sq-msg-body sq-typing"><span /><span /><span /></p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="sq-input-area">
                <input
                  className="sq-input"
                  placeholder="Type a message or ask AI..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(false)}
                />
                <button className="sq-send-btn chat" onClick={() => sendMessage(false)} disabled={!input.trim()}>
                  💬 Send
                </button>
                <button className="sq-send-btn ai" onClick={() => sendMessage(true)} disabled={!input.trim() || chatLoading}>
                  🤖 Ask AI
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
