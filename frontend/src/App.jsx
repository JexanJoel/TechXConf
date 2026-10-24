import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import StudyRoom from './pages/StudyRoom'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import SquadStudy from './pages/SquadStudy'
import Podcast from './pages/Podcast'
import BrainGalaxy from './pages/BrainGalaxy'
import ProfLens from './pages/ProfLens'
import PanicMode from './pages/PanicMode'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study/:id" element={<StudyRoom />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/squad/:id" element={<SquadStudy />} />
        <Route path="/podcast/:id" element={<Podcast />} />
        <Route path="/galaxy" element={<BrainGalaxy />} />
        <Route path="/lens" element={<ProfLens />} />
        <Route path="/panic" element={<PanicMode />} />
      </Routes>
    </BrowserRouter>
  )
}