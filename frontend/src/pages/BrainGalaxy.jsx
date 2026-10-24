import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './BrainGalaxy.css'

export default function BrainGalaxy() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState([])
  const [connections, setConnections] = useState([])

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }

    // Only select columns that actually exist in the pdfs table
    const { data: pdfs, error } = await supabase
      .from('pdfs')
      .select('id, filename, created_at')
      .eq('user_id', session.user.id)

    if (error) { console.error('Galaxy fetch error:', error); setLoading(false); return }
    if (!pdfs || pdfs.length === 0) { setLoading(false); return }

    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6']
    const pdfNodes = pdfs.map((p, i) => {
      const angle = (i / pdfs.length) * Math.PI * 2
      const radius = Math.min(250, 120 + pdfs.length * 20)
      return {
        id: p.id,
        label: p.filename?.replace('.pdf', '') || `PDF ${i + 1}`,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        radius: 34,
        color: colors[i % colors.length],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        type: 'pdf'
      }
    })

    pdfNodes.unshift({
      id: 'center', label: 'Your Brain',
      x: 400, y: 300, radius: 48,
      color: '#7c3aed', type: 'brain', vx: 0, vy: 0
    })

    const conns = pdfs.map(p => ({ from: 'center', to: p.id, strength: 0.5 }))

    setNodes(pdfNodes)
    setConnections(conns)
    setLoading(false)
  }

  useEffect(() => {
    if (loading || nodes.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = Math.max(500, canvas.parentElement.clientHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.15 + 0.05
    }))

    let time = 0
    const draw = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      nodes.forEach(n => { if (n.type === 'brain') { n.x = cx; n.y = cy } })

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`
        ctx.fill()
      })

      // Draw connections
      connections.forEach(c => {
        const from = nodes.find(n => n.id === c.from)
        const to = nodes.find(n => n.id === c.to)
        if (!from || !to) return
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.12)'
        ctx.lineWidth = 2
        ctx.stroke()

        const pulse = (Math.sin(time * 2 + c.strength * 5) + 1) / 2
        const px = from.x + (to.x - from.x) * pulse
        const py = from.y + (to.y - from.y) * pulse
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(124, 58, 237, 0.35)'
        ctx.fill()
      })

      // Draw nodes
      nodes.forEach(n => {
        if (n.type !== 'brain') {
          n.x += Math.sin(time + n.radius) * 0.3
          n.y += Math.cos(time + n.radius * 0.7) * 0.3
        }

        // Glow
        const gradient = ctx.createRadialGradient(n.x, n.y, n.radius * 0.5, n.x, n.y, n.radius * 2.5)
        gradient.addColorStop(0, `${n.color}18`)
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Node circle
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = n.color
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Label
        ctx.fillStyle = 'white'
        ctx.font = `bold ${n.type === 'brain' ? 13 : 11}px "DM Sans", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const lbl = n.label.length > 12 ? n.label.slice(0, 12) + '…' : n.label
        ctx.fillText(n.type === 'brain' ? '🧠' : lbl, n.x, n.y)

        // Below label
        if (n.type === 'pdf') {
          ctx.fillStyle = '#6b7280'
          ctx.font = '500 10px "DM Sans", sans-serif'
          ctx.fillText('Click to study', n.x, n.y + n.radius + 14)
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }
    draw()

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      nodes.forEach(n => {
        const dist = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2)
        if (dist < n.radius && n.type === 'pdf') navigate(`/study/${n.id}`)
      })
    }
    canvas.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleClick)
    }
  }, [loading, nodes])

  if (loading) return <div className="bg-loader"><div className="bg-spinner" /><p>Mapping your brain...</p></div>

  return (
    <div className="bg-root">
      <header className="bg-header">
        <div className="bg-header-inner">
          <div className="bg-brand" onClick={() => navigate('/')}>
            <span>📚</span><span className="bg-brand-text">LearnLens</span>
          </div>
          <button className="bg-back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        </div>
      </header>

      <main className="bg-main">
        <div className="bg-title-bar">
          <div>
            <h1>🌌 Brain Galaxy</h1>
            <p>Your knowledge universe — click a planet to study</p>
          </div>
          <span className="bg-node-count">{nodes.filter(n => n.type === 'pdf').length} documents</span>
        </div>

        {nodes.filter(n => n.type === 'pdf').length === 0 ? (
          <div className="bg-empty">
            <span>🪐</span>
            <h3>No planets yet</h3>
            <p>Upload your first PDF and it will appear as a planet in your galaxy.</p>
            <button className="bg-upload-btn" onClick={() => navigate('/dashboard')}>← Go to Dashboard</button>
          </div>
        ) : (
          <div className="bg-canvas-wrap">
            <canvas ref={canvasRef} className="bg-canvas" />
          </div>
        )}
      </main>
    </div>
  )
}
