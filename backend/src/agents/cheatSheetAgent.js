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

export async function generateCheatSheet(pdfId) {
  try {
    const context = await getPDFChunks(pdfId)

    const prompt = `You are a study assistant. Based on the following study material, generate a concise cheat sheet.

Return ONLY a valid JSON object. No explanation, no markdown, no backticks, no extra text — just raw JSON.

Format:
{
  "title": "Topic Title",
  "key_concepts": ["concept 1", "concept 2", "concept 3"],
  "important_formulas": ["formula 1", "formula 2"],
  "quick_facts": ["fact 1", "fact 2", "fact 3"],
  "summary": "2-3 sentence overall summary"
}

Study Material:
${context}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1024
    })

    const raw = response.choices[0].message.content.trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)
    return result
  } catch (err) {
    console.error('CheatSheet error:', err)
    throw err
  }
}