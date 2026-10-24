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

export async function generatePodcastScript(pdfId) {
  const context = await getPDFChunks(pdfId)

  const prompt = `You are a podcast script writer. Based on the following study material, generate a podcast script as a conversation between a "host" and a "professor".

Return ONLY a valid JSON object. No explanation, no markdown, no backticks.

Format:
{
  "title": "Episode title",
  "segments": [
    { "speaker": "host", "text": "Welcome to the show..." },
    { "speaker": "professor", "text": "Thanks for having me..." },
    ...more segments (aim for 8-12 total)
  ]
}

Keep each segment 1-3 sentences. Make it conversational, engaging, and educational.

Study Material:
${context}`

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 2048
  })

  const raw = response.choices[0].message.content.trim()
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
