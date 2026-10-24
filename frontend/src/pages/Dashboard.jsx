import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [user, setUser] = useState(null)
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Gamification
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [levelName, setLevelName] = useState('Novice')
  const [nextLevelXp, setNextLevelXp] = useState(100)

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }
    setUser(session.user)
    fetchPDFs(session.user.id)
    fetchGamification(session.user.id)
  }

  const fetchGamification = async (userId) => {
    try {
      const res = await api.get(`/gamification/profile/${userId}`)
      setXp(res.data.profile?.xp || 0)
      setLevel(res.data.profile?.level || 1)
      setLevelName(res.data.level_name || 'Novice')
      setNextLevelXp(res.data.next_level_xp || 100)
    } catch {}
  }

  const fetchPDFs = async (userId) => {
    setLoading(true)
    try {
      const res = await api.get(`/pdf/list/${userId}`)
      setPdfs(res.data.pdfs)
    } catch {
      setError('Failed to load PDFs')
    }
    setLoading(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Only PDF files allowed'); return }
    if (file.size > 50 * 1024 * 1024) { setError('File too large (max 50MB)'); return }
    setUploading(true); setError('')
    setUploadProgress('Uploading & processing PDF...')
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('user_id', user.id)
      await api.post('/pdf/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      fetchPDFs(user.id)
      setUploadProgress('')
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Try again.')
      setUploadProgress('')
    }
    setUploading(false)
    fileRef.current.value = ''
  }

  const handleDelete = async (pdfId) => {
    if (!confirm('Delete this PDF and all its data?')) return
    try {
      await api.delete(`/pdf/${pdfId}`)
      setPdfs(prev => prev.filter(p => p.id !== pdfId))
    } catch { setError('Delete failed') }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const getInitials = (email) => email ? email[0].toUpperCase() : '?'
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const filteredPdfs = pdfs.filter(p => p.filename.toLowerCase().includes(search.toLowerCase()))

  const sidebarItems = [
    { icon: '📄', label: 'My Documents', active: true, action: () => {} },
    { icon: '🌌', label: 'Brain Galaxy', action: () => navigate('/galaxy') },
    { icon: '🚨', label: 'Panic Mode', action: () => navigate('/panic') },
    { icon: '🔭', label: 'Professor Lens', action: () => navigate('/lens') },
  ]

  return (
    <div className="d-root">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="d-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`d-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="d-sb-top">
          <div className="d-sb-brand" onClick={() => navigate('/')}>
            <span className="d-sb-logo">📚</span>
            <span className="d-sb-name">LearnLens</span>
          </div>
        </div>

        <nav className="d-sb-nav">
          <p className="d-sb-section">MAIN</p>
          {sidebarItems.map((item, i) => (
            <button
              key={i}
              className={`d-sb-item ${item.active ? 'active' : ''}`}
              onClick={() => { item.action(); setSidebarOpen(false) }}
            >
              <span className="d-sb-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <p className="d-sb-section">ACCOUNT</p>
          <button className="d-sb-item" onClick={handleLogout}>
            <span className="d-sb-item-icon">🚪</span>
            <span>Log out</span>
          </button>
        </nav>

        <div className="d-sb-bottom">
          <div className="d-sb-xp">
            <div className="d-sb-xp-head">
              <span className="d-sb-rank">Lv.{level} {levelName}</span>
              <span className="d-sb-xp-num">{xp} XP</span>
            </div>
            <div className="d-sb-xp-track">
              <div className="d-sb-xp-fill" style={{ width: `${Math.min((xp / nextLevelXp) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="d-sb-user">
            <div className="d-sb-avatar">{user ? getInitials(user.email) : '?'}</div>
            <div className="d-sb-user-info">
              <span className="d-sb-user-name">{user?.email?.split('@')[0]}</span>
              <span className="d-sb-user-email">{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="d-content">
        {/* Top bar */}
        <header className="d-topbar">
          <button className="d-hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="d-search-wrap">
            <span className="d-search-icon">🔍</span>
            <input
              type="text"
              className="d-search"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="d-topbar-right">
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleUpload} />
            <button className="d-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? <><span className="d-btn-spinner" /> Processing...</> : '＋ Upload PDF'}
            </button>
          </div>
        </header>

        <main className="d-main">
          {/* Greeting + Stats */}
          <div className="d-welcome">
            <div className="d-welcome-left">
              <h1>{getGreeting()}, {user?.email?.split('@')[0]} 👋</h1>
              <p>You have <strong>{pdfs.length}</strong> documents and <strong>{xp}</strong> XP earned.</p>
            </div>
          </div>

          <div className="d-stat-row">
            <div className="d-stat"><span className="d-stat-num">{pdfs.length}</span><span className="d-stat-lbl">Documents</span></div>
            <div className="d-stat"><span className="d-stat-num">9</span><span className="d-stat-lbl">AI Agents</span></div>
            <div className="d-stat"><span className="d-stat-num">{xp}</span><span className="d-stat-lbl">Total XP</span></div>
            <div className="d-stat"><span className="d-stat-num">Lv.{level}</span><span className="d-stat-lbl">{levelName}</span></div>
          </div>

          {/* Error */}
          {error && (
            <div className="d-error">{error}<span onClick={() => setError('')}>✕</span></div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="d-progress-wrap">
              <p>⚙️ {uploadProgress}</p>
              <div className="d-progress-bar"><div className="d-progress-fill" /></div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="d-loading"><div className="d-spinner-lg" /><p>Loading your materials...</p></div>
          ) : pdfs.length === 0 ? (
            <div className="d-empty">
              <div className="d-empty-icon">📭</div>
              <h3>No documents yet</h3>
              <p>Upload your first PDF and let AI do the heavy lifting</p>
              <button className="d-upload-btn" onClick={() => fileRef.current.click()}>＋ Upload your first PDF</button>
            </div>
          ) : (
            <>
              <div className="d-section-head">
                <h2>📚 Documents</h2>
                <span className="d-doc-count">
                  {search ? `${filteredPdfs.length} found` : `${pdfs.length} total`}
                </span>
              </div>
              <div className="d-grid">
                {filteredPdfs.map((pdf) => {
                  const hasScore = pdf.last_score !== null && pdf.last_score !== undefined;
                  const scorePct = hasScore ? Math.round((pdf.last_score / (pdf.last_total || 1)) * 100) : 0;
                  return (
                    <div key={pdf.id} className="d-card">
                      <div className="d-card-top">
                        <div className="d-card-icon">📄</div>
                        <div className="d-card-top-right">
                          {hasScore && (
                            <span className={`d-badge ${scorePct >= 80 ? 'good' : scorePct >= 50 ? 'avg' : 'low'}`}>
                              {scorePct}%
                            </span>
                          )}
                          <button className="d-card-del" onClick={() => handleDelete(pdf.id)} title="Delete">✕</button>
                        </div>
                      </div>
                      <div className="d-card-body">
                        <h3 title={pdf.filename}>{pdf.filename}</h3>
                        <p className="d-card-meta">
                          {formatDate(pdf.created_at)}
                          {hasScore && <> · <strong>{pdf.last_score}/{pdf.last_total}</strong></>}
                        </p>
                      </div>
                      <div className="d-card-actions">
                        <button className="d-act primary" onClick={() => navigate(`/study/${pdf.id}`)}>📖 Study</button>
                        <button className="d-act secondary" onClick={() => navigate(`/quiz/${pdf.id}`)}>📝 Quiz</button>
                        <button className="d-act ghost" onClick={() => navigate(`/squad/${pdf.id}`)}>🤝 Squad</button>
                        <button className="d-act ghost" onClick={() => navigate(`/podcast/${pdf.id}`)}>🎙️ Audio</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}