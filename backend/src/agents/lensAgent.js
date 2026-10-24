import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analyzeImage(base64Image) {
  // Extract any text hint from the base64 data (won't have actual OCR without vision model)
  // Instead, we use the browser's built-in OCR approach:
  // The frontend will use Canvas to extract text, then send it for explanation
  
  // If the image data contains extracted text (sent as a string instead of base64)
  if (!base64Image.startsWith('data:')) {
    // It's already extracted text, just explain it
    return await explainText(base64Image)
  }

  // For base64 images, return guidance
  return {
    text: 'Image captured successfully. For best results, use the browser\'s built-in text selection or type the text you see.',
    explanation: 'Tip: Select and copy text from your screen, then paste it here for an AI explanation. Camera OCR requires a vision-capable model.'
  }
}

export async function explainText(text) {
  const prompt = `You are a friendly study tutor. A student captured this text from their textbook or notes. 

Do two things:
1. Clean up and format the text
2. Explain it in simple, student-friendly language

Return ONLY a valid JSON object. No markdown, no backticks.
{
  "text": "The cleaned-up extracted text",
  "explanation": "A clear, simple explanation that a student would understand"
}

Captured text:
${text}`

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1024
  })

  const raw = response.choices[0].message.content.trim()
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
