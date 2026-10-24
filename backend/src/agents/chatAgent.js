import Groq from 'groq-sdk'
import { supabase } from '../lib/supabase.js'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function getRelevantChunks(pdfId, question) {
  // Get all chunks and do simple keyword matching
  const { data, error } = await supabase
    .from('pdf_chunks')
    .select('content')
    .eq('pdf_id', pdfId)
    .limit(20)

  if (error) throw error

  // Score chunks by keyword overlap
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const scored = data.map(chunk => ({
    content: chunk.content,
    score: words.reduce((acc, word) =>
      acc + (chunk.content.toLowerCase().includes(word) ? 1 : 0), 0)
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 5).map(c => c.content).join('\n\n')
}

export async function chatWithPDF(pdfId, question, history = []) {
  try {
    const context = await getRelevantChunks(pdfId, question)

    const systemPrompt = `You are a helpful study assistant. Answer the student's question based ONLY on the following content from their study material. If the answer is not in the content, say "I couldn't find that in your document."

Study Material:
${context}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: question }
    ]

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages,
      temperature: 0.5,
      max_tokens: 1024
    })

    return response.choices[0].message.content
  } catch (err) {
    console.error('Chat error:', err)
    throw err
  }
}