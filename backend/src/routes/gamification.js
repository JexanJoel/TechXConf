import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get or create profile
router.get('/profile/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params
    let { data, error } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (error || !data) {
      // Create new profile
      const newProfile = {
        user_id,
        xp: 0,
        level: 1,
        badges: [],
        total_quizzes: 0,
        total_correct: 0,
        streak: 0
      }
      const { data: created, error: createErr } = await supabase
        .from('gamification')
        .upsert(newProfile)
        .select()
        .single()

      if (createErr) {
        // Table might not exist yet, return default profile
        return res.json({
          profile: newProfile,
          level_name: getLevelName(1)
        })
      }
      data = created
    }

    const level = Math.max(1, Math.floor(Math.sqrt(data.xp / 100)))
    res.json({
      profile: { ...data, level },
      level_name: getLevelName(level),
      next_level_xp: Math.pow(level + 1, 2) * 100,
      xp_in_level: data.xp - Math.pow(level, 2) * 100
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Award XP
router.post('/award', async (req, res) => {
  try {
    const { user_id, xp_amount, action } = req.body
    if (!user_id || !xp_amount) return res.status(400).json({ error: 'user_id and xp_amount required' })

    // Get current profile
    let { data } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!data) {
      data = { user_id, xp: 0, level: 1, badges: [], total_quizzes: 0, total_correct: 0, streak: 0 }
    }

    const newXP = (data.xp || 0) + xp_amount
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newXP / 100)))
    const leveled = newLevel > (data.level || 1)

    // Check for new badges
    const badges = data.badges || []
    const newBadges = []

    if (action === 'quiz_complete' && !badges.includes('first_quiz')) {
      newBadges.push('first_quiz')
    }
    if (action === 'perfect_score' && !badges.includes('perfect_score')) {
      newBadges.push('perfect_score')
    }
    if (newXP >= 500 && !badges.includes('scholar')) {
      newBadges.push('scholar')
    }
    if (newXP >= 1000 && !badges.includes('master')) {
      newBadges.push('master')
    }
    if (newXP >= 2500 && !badges.includes('legend')) {
      newBadges.push('legend')
    }

    const updatedBadges = [...badges, ...newBadges]

    const { error } = await supabase
      .from('gamification')
      .upsert({
        user_id,
        xp: newXP,
        level: newLevel,
        badges: updatedBadges,
        total_quizzes: data.total_quizzes || 0,
        total_correct: data.total_correct || 0,
        streak: data.streak || 0
      })

    if (error) {
      // Table might not exist — just return computed values
      return res.json({ xp: newXP, level: newLevel, leveled, new_badges: newBadges })
    }

    res.json({
      xp: newXP,
      level: newLevel,
      leveled,
      new_badges: newBadges,
      level_name: getLevelName(newLevel)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

function getLevelName(level) {
  const names = ['Novice', 'Learner', 'Scholar', 'Expert', 'Master', 'Sage', 'Genius', 'Legend', 'Titan', 'Immortal']
  return names[Math.min(level - 1, names.length - 1)] || 'Transcendent'
}

export default router
