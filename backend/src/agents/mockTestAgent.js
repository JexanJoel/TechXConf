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
    .limit(10)

  if (error) throw error
  if (!data || data.length === 0) throw new Error('No content found for this PDF')
  return data.map(c => c.content).join('\n\n')
}

export async function generateMockTest(pdfId, count = 5) {
  try {
    const context = await getPDFChunks(pdfId)

    const prompt = `You are an exam question generator. Based on the following study material, generate exactly ${count} multiple choice questions.

Return ONLY a valid JSON array. No explanation, no markdown, no backticks, no extra text — just raw JSON.

Format:
[
  {
    "question": "Question text here?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1",
    "topic": "topic name"
  }
]

Study Material:
${context}`

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })

    const raw = response.choices[0].message.content.trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(cleaned)
    return questions
  } catch (err) {
    console.error('MockTest error:', err)
    throw err
  }
}