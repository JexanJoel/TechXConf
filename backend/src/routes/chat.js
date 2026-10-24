import express from 'express'
import { chatWithPDF } from '../agents/chatAgent.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { pdf_id, question, history } = req.body
    if (!pdf_id || !question) {
      return res.status(400).json({ error: 'pdf_id and question are required' })
    }

    const answer = await chatWithPDF(pdf_id, question, history || [])
    res.json({ answer })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router