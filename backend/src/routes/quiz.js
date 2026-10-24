import express from 'express'
import { generateMockTest } from '../agents/mockTestAgent.js'
import { analyzeWeakAreas } from '../agents/weakAreaAgent.js'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Generate mock test
router.post('/generate', async (req, res) => {
  try {
    const { pdf_id, count } = req.body
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

    const questions = await generateMockTest(pdf_id, count || 5)
    res.json({ questions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Submit quiz results
router.post('/submit', async (req, res) => {
  try {
    const { pdf_id, user_id, score, total, answers } = req.body

    const weakAreas = await analyzeWeakAreas(answers)

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({ pdf_id, user_id, score, total, weak_topics: weakAreas })
      .select()
      .single()

    if (error) throw error
    res.json({ result: data, weak_topics: weakAreas })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get quiz history
router.get('/history/:pdf_id/:user_id', async (req, res) => {
  try {
    const { pdf_id, user_id } = req.params
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('pdf_id', pdf_id)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ history: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router