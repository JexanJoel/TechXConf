import express from 'express'
import { generateCheatSheet } from '../agents/cheatSheetAgent.js'
import { predictExamQuestions } from '../agents/examPredictorAgent.js'
import { generatePodcastScript } from '../agents/podcastAgent.js'
import { generatePanicPlan } from '../agents/panicAgent.js'
import { analyzeImage } from '../agents/lensAgent.js'

const router = express.Router()

// Generate cheat sheet
router.post('/cheatsheet', async (req, res) => {
  try {
    const { pdf_id } = req.body
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

    const cheatsheet = await generateCheatSheet(pdf_id)
    res.json({ cheatsheet })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Predict exam questions
router.post('/predict', async (req, res) => {
  try {
    const { pdf_id } = req.body
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

    const predictions = await predictExamQuestions(pdf_id)
    res.json({ predictions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Generate podcast script
router.post('/podcast', async (req, res) => {
  try {
    const { pdf_id } = req.body
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

    const script = await generatePodcastScript(pdf_id)
    res.json({ script })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Generate panic mode study plan
router.post('/panic', async (req, res) => {
  try {
    const { pdf_id, hours } = req.body
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

    const plan = await generatePanicPlan(pdf_id, hours || 2)
    res.json({ plan })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Professor Lens - Analyze camera image
router.post('/lens', async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'image data is required' })

    const result = await analyzeImage(image)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router