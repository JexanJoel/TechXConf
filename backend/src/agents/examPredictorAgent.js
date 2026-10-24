import Groq from 'groq-sdk'
import { supabase } from '../lib/supabase.js'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function getPDFChunks(pdfId) {
  const { data, error } = await supabase
    .from('pdf_chunks')
    .select('content')
    .eq('pdf_id', pdfId)
    .limit(15)

  if (error) throw error
  if (!data || data.length === 0) throw new Error('No content found for this PDF')
  return data.map(c => c.content).join('\n\n')
}

export async function predictExamQuestions(pdfId) {
  try {
    const context = await getPDFChunks(pdfId)

    const prompt = `You are an expert exam predictor. Analyze the following study material and predict the most likely exam questions.

Return ONLY a valid JSON array. No explanation, no markdown, no backticks, no extra text — just raw JSON.

Format:
[
  {
    "question": "Predicted exam question?",
    "confidence": 90,
    "topic": "topic name",
    "reason": "Why this is likely to appear in the exam"
  }
]

Rules:
- Generate exactly 6 predicted questions
- Confidence scores must be between 60 and 95
- Base questions strictly on the provided study material
- Make questions specific to the actual content, not generic

Study Material:
${context}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1024
    })

    const raw = response.choices[0].message.content.trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)
    return result
  } catch (err) {
    console.error('ExamPredictor error:', err)
    throw err
  }
}