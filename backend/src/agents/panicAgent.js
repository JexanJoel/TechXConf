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

export async function generatePanicPlan(pdfId, hours) {
  const context = await getPDFChunks(pdfId)

  const prompt = `You are a study scheduler. A student has ${hours} hours before their exam. Based on the study material below, create an intensive, minute-by-minute study plan.

Return ONLY a valid JSON object. No explanation, no markdown, no backticks.

Format:
{
  "title": "Study Plan for <topic>",
  "total_minutes": ${hours * 60},
  "phases": [
    {
      "type": "read",
      "title": "Phase name",
      "duration_minutes": 15,
      "content": "What to study in this phase",
      "key_points": ["point 1", "point 2"]
    },
    {
      "type": "quiz",
      "title": "Quick Quiz",
      "duration_minutes": 5,
      "questions": ["question 1?", "question 2?"]
    },
    {
      "type": "review",
      "title": "Review Phase",
      "duration_minutes": 10,
      "content": "What to review"
    }
  ]
}

Create 6-10 phases alternating between read, quiz, and review. Focus on the most important 20% of content that covers 80% of what they need to know. Each phase should have a clear, actionable description.

Study Material:
${context}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 2048
  })

  const raw = response.choices[0].message.content.trim()
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
