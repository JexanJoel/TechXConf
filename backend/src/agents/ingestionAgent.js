import { supabase } from '../lib/supabase.js'

function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/)
  const chunks = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks
}

export async function ingestPDF(pdfId, text) {
  try {
    console.log(`Ingesting PDF: ${pdfId}`)
    const chunks = chunkText(text)
    console.log(`Total chunks: ${chunks.length}`)

    for (const chunk of chunks) {
      const { error } = await supabase.from('pdf_chunks').insert({
        pdf_id: pdfId,
        content: chunk,
        embedding: null
      })
      if (error) throw error
    }

    console.log(`Ingestion complete for PDF: ${pdfId}`)
    return { success: true, chunks: chunks.length }
  } catch (err) {
    console.error('Ingestion error:', err)
    throw err
  }
}