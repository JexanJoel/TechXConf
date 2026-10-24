import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pdfRoutes from './routes/pdf.js'
import chatRoutes from './routes/chat.js'
import quizRoutes from './routes/quiz.js'
import studyRoutes from './routes/study.js'
import gamificationRoutes from './routes/gamification.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => {
  res.json({ message: 'LearnLens API running 🚀' })
})

app.use('/api/pdf', pdfRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/study', studyRoutes)
app.use('/api/gamification', gamificationRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})