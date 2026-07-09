import { Router } from 'express';
import { generateRecommendations } from '../services/recommendationService';
import { trackRecommendationMetrics } from './feedback';

const router = Router();

/**
 * GET /api/recommendations
 * Generates recommendations based on dial value (0-100)
 * Query params:
 * - dial_value: number (0-100, required)
 * - limit: number (optional, default 15)
 * - access_token: string (required)
 */
router.get('/', async (req, res) => {
  const { dial_value, limit, access_token } = req.query;

  // Validate required parameters
  if (!dial_value) {
    return res.status(400).json({ error: 'Missing required parameter: dial_value' });
  }

  if (!access_token) {
    return res.status(400).json({ error: 'Missing required parameter: access_token' });
  }

  // Parse and validate dial value
  const dialValue = parseInt(dial_value as string, 10);
  if (isNaN(dialValue) || dialValue < 0 || dialValue > 100) {
    return res.status(400).json({ error: 'dial_value must be a number between 0 and 100' });
  }

  // Parse limit
  const recommendationLimit = limit ? parseInt(limit as string, 10) : 15;
  if (isNaN(recommendationLimit) || recommendationLimit < 1 || recommendationLimit > 50) {
    return res.status(400).json({ error: 'limit must be a number between 1 and 50' });
  }

  try {
    const recommendations = await generateRecommendations(
      access_token as string,
      dialValue,
      recommendationLimit
    );

    // Track metrics
    trackRecommendationMetrics(dialValue, recommendations.length);

    res.json({
      dial_value: dialValue,
      count: recommendations.length,
      recommendations,
    });
  } catch (error: any) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

export default router;
