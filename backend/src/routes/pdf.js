import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import { supabase } from '../lib/supabase.js'
import { ingestPDF } from '../agents/ingestionAgent.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Upload PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { user_id } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    // Upload to Supabase Storage
    const filename = `${Date.now()}_${file.originalname}`
    const { error: storageError } = await supabase.storage
      .from('pdfs')
      .upload(filename, file.buffer, { contentType: 'application/pdf' })

    if (storageError) throw storageError

    // Get public URL
    const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filename)

    // Save to pdfs table — store the storage filename separately for deletion later
    const { data: pdfRecord, error: dbError } = await supabase
      .from('pdfs')
      .insert({
        user_id,
        filename: file.originalname,
        file_url: urlData.publicUrl,
        storage_path: filename
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Parse PDF text
    const parsed = await pdfParse(file.buffer)
    const text = parsed.text

    // Run ingestion agent (chunk + store)
    await ingestPDF(pdfRecord.id, text)

    res.json({ success: true, pdf: pdfRecord })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get all PDFs for a user with latest quiz stats
router.get('/list/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params
    
    // Fetch PDFs
    const { data: pdfs, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (pdfError) throw pdfError

    // Fetch latest quiz results for these PDFs
    // We'll do this in a simple way for the hackathon: 
    // Get the most recent result for each PDF_ID
    const { data: results, error: resError } = await supabase
      .from('quiz_results')
      .select('pdf_id, score, total, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (resError) throw resError

    // Map the latest result to each PDF
    const pdfsWithStats = pdfs.map(pdf => {
      const latestResult = results.find(r => r.pdf_id === pdf.id)
      return {
        ...pdf,
        last_score: latestResult ? latestResult.score : null,
        last_total: latestResult ? latestResult.total : null,
        last_quiz_at: latestResult ? latestResult.created_at : null
      }
    })

    res.json({ pdfs: pdfsWithStats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete a PDF
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Get PDF record to find storage path
    const { data: pdf, error: fetchError } = await supabase
      .from('pdfs')
      .select('storage_path, filename')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete chunks first
    const { error: chunksError } = await supabase
      .from('pdf_chunks')
      .delete()
      .eq('pdf_id', id)

    if (chunksError) console.error('Chunks delete error:', chunksError)

    // Delete from storage
    const storagePath = pdf.storage_path || pdf.filename
    const { error: storageError } = await supabase.storage
      .from('pdfs')
      .remove([storagePath])

    if (storageError) console.error('Storage delete error:', storageError)

    // Delete PDF record
    const { error: dbError } = await supabase
      .from('pdfs')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

    res.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router