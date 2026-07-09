import { Router } from 'express';
import { db } from '../config/db';
import { updateFeedbackWeights } from '../services/recommendationService';

const router = Router();

/**
 * Simple metrics tracking (in-memory for MVP)
 */
const metrics = {
  totalRecommendations: 0,
  totalFeedback: 0,
  totalLikes: 0,
  totalDislikes: 0,
  dialValueDistribution: {} as Record<string, number>,
};

/**
 * Track recommendation generation metrics
 */
export function trackRecommendationMetrics(dialValue: number, count: number): void {
  metrics.totalRecommendations += count;
  const dialBucket = Math.floor(dialValue / 10) * 10;
  const bucketKey = `${dialBucket}-${dialBucket + 9}`;
  metrics.dialValueDistribution[bucketKey] = (metrics.dialValueDistribution[bucketKey] || 0) + count;
}

/**
 * POST /api/feedback
 * Saves user feedback (like/dislike) for a recommendation
 * Body params:
 * - user_id: string (required)
 * - track_id: string (required)
 * - track_name: string (required)
 * - artists: string[] (required)
 * - dial_value: number (required)
 * - discovery_score: number (required)
 * - is_liked: boolean (required)
 */
router.post('/', async (req, res) => {
  const { user_id, track_id, track_name, artists, dial_value, discovery_score, is_liked } = req.body;

  // Validate required parameters
  if (!user_id || !track_id || !track_name || !artists || dial_value === undefined || discovery_score === undefined || is_liked === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate data types
  if (typeof dial_value !== 'number' || dial_value < 0 || dial_value > 100) {
    return res.status(400).json({ error: 'dial_value must be a number between 0 and 100' });
  }

  if (typeof discovery_score !== 'number' || discovery_score < 0 || discovery_score > 100) {
    return res.status(400).json({ error: 'discovery_score must be a number between 0 and 100' });
  }

  if (typeof is_liked !== 'boolean') {
    return res.status(400).json({ error: 'is_liked must be a boolean' });
  }

  if (!Array.isArray(artists)) {
    return res.status(400).json({ error: 'artists must be an array' });
  }

  try {
    const feedback = await db.saveFeedback({
      user_id,
      track_id,
      track_name,
      artists,
      dial_value,
      discovery_score,
      is_liked,
    });

    // Update feedback weights for recommendation algorithm
    updateFeedbackWeights(track_id, is_liked);

    // Track metrics
    metrics.totalFeedback += 1;
    if (is_liked) {
      metrics.totalLikes += 1;
    } else {
      metrics.totalDislikes += 1;
    }

    res.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('Feedback save error:', error);
    res.status(500).json({ error: error.message || 'Failed to save feedback' });
  }
});

/**
 * GET /api/feedback/:user_id
 * Retrieves all feedback for a specific user
 */
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    const feedback = await db.getFeedbackByUserId(user_id);

    res.json({
      user_id,
      count: feedback.length,
      feedback,
    });
  } catch (error: any) {
    console.error('Feedback retrieval error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve feedback' });
  }
});

export default router;
