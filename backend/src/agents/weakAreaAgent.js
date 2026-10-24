import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analyzeWeakAreas(answers) {
  try {
    const wrongAnswers = answers.filter(a => !a.correct)

    if (wrongAnswers.length === 0) return []

    const prompt = `A student got the following questions wrong in a quiz:

${wrongAnswers.map((a, i) => `${i + 1}. Question: ${a.question} | Topic: ${a.topic}`).join('\n')}

Return ONLY a valid JSON array of weak topic names, no explanation, no markdown, no backticks.

Example: ["Newton's Laws", "Thermodynamics", "Optics"]`

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 256
    })

    const raw = response.choices[0].message.content.trim()
    return JSON.parse(raw)
  } catch (err) {
    console.error('WeakArea error:', err)
    return []
  }
}