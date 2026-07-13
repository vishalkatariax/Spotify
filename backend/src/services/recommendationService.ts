import { fetchTopArtists, isMockMode, SpotifyTrack, SpotifyArtist } from './spotifyService';

export interface Recommendation {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  imageUrl?: string;
  previewUrl?: string;
  spotifyUrl: string;
  discoveryScore: number;
  explanation: string;
}

interface RecommendationCache {
  [key: string]: {
    recommendations: Recommendation[];
    timestamp: number;
  };
}

const cache: RecommendationCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate explanation based on discovery score and artist/track info
 */
function generateExplanation(track: SpotifyTrack, discoveryScore: number, seedArtists: string[]): string {
  const score = discoveryScore;
  const artistName = track.artists[0];
  
  if (score < 30) {
    return `Similar to ${seedArtists.slice(0, 2).join(' and ')}. ${artistName} shares familiar sounds you already enjoy.`;
  } else if (score < 50) {
    return `A balanced pick. ${artistName} has elements of ${seedArtists[0]} but brings something fresh to the table.`;
  } else if (score < 70) {
    return `Step outside your comfort zone. ${artistName} explores new territory while staying connected to ${seedArtists[0]}'s genre.`;
  } else {
    return `Deep discovery! ${artistName} pushes boundaries with unique sounds that expand your musical horizon.`;
  }
}

/**
 * Fetch related artists for a given artist ID
 */
async function fetchRelatedArtists(accessToken: string, artistId: string): Promise<SpotifyArtist[]> {
  const useMockMode = isMockMode || accessToken.startsWith('mock_') || accessToken.includes('mock');
  
  if (useMockMode) {
    // Mock related artists
    const mockArtists: SpotifyArtist[] = [
      {
        id: 'rel1',
        name: 'Glass Animals',
        genres: ['indie pop', 'psychedelic pop'],
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 75,
        spotifyUrl: 'https://open.spotify.com/artist/5q8pTG2eqqR0VNmQxL3Fi1',
      },
      {
        id: 'rel2',
        name: 'Tame Impala',
        genres: ['psychedelic pop', 'neo-psychedelia'],
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 88,
        spotifyUrl: 'https://open.spotify.com/artist/5INjqhS0s8JIfNZVEqGqA4',
      },
      {
        id: 'rel3',
        name: 'M83',
        genres: ['synthpop', 'shoegaze'],
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 70,
        spotifyUrl: 'https://open.spotify.com/artist/3m6dTq6p5rW8J8ZyQyQyQy',
      },
    ];
    return mockArtists;
  }

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify API error (${response.status}): ${response.statusText}`);
    // Fallback to mock data if Spotify API fails
    console.warn('Falling back to mock data due to Spotify API error');
    const mockArtists: SpotifyArtist[] = [
      {
        id: 'rel1',
        name: 'A.R. Rahman',
        genres: ['indian pop', 'filmi', 'indian classical'],
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 85,
        spotifyUrl: 'https://open.spotify.com/artist/1YR4wmos3C1femYmuj7Aqy',
      },
      {
        id: 'rel2',
        name: 'Sonu Nigam',
        genres: ['indian pop', 'filmi'],
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 80,
        spotifyUrl: 'https://open.spotify.com/artist/4YRxDV8uJRC7zbgvEJp9R8',
      },
      {
        id: 'rel3',
        name: 'Shankar-Ehsaan-Loy',
        genres: ['indian pop', 'filmi', 'fusion'],
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 75,
        spotifyUrl: 'https://open.spotify.com/artist/3m6dTq6p5rW8J8ZyQyQyQy',
      },
    ];
    return mockArtists;
  }

  const data = await response.json() as {
    artists: Array<{
      id: string;
      name: string;
      genres: string[];
      images?: Array<{ url: string }>;
      popularity: number;
      external_urls: { spotify: string };
    }>;
  };

  return data.artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : undefined,
    popularity: artist.popularity,
    spotifyUrl: artist.external_urls.spotify,
  }));
}

/**
 * Fetch top tracks for an artist
 */
async function fetchArtistTopTracks(accessToken: string, artistId: string): Promise<SpotifyTrack[]> {
  const useMockMode = isMockMode || accessToken.startsWith('mock_') || accessToken.includes('mock');
  
  if (useMockMode) {
    // Mock top tracks
    const mockTracks: SpotifyTrack[] = [
      {
        id: 'track1',
        name: 'Heat Waves',
        artists: ['Glass Animals'],
        albumName: 'Dreamland',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/0U01AXKW4h78j4564357',
      },
      {
        id: 'track2',
        name: 'The Less I Know The Better',
        artists: ['Tame Impala'],
        albumName: 'Currents',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/698eCG4v436OI86ISg6DQ6',
      },
      {
        id: 'track3',
        name: 'Midnight City',
        artists: ['M83'],
        albumName: 'Hurry Up, We\'re Dreaming',
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/0U01AXKW4h78j4564358',
      },
    ];
    return mockTracks;
  }

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify API error (${response.status}): ${response.statusText}`);
    // Fallback to mock data if Spotify API fails
    console.warn('Falling back to mock data due to Spotify API error');
    const mockTracks: SpotifyTrack[] = [
      {
        id: `track1_${artistId}`,
        name: 'Kabhi Kabhi Aditi',
        artists: ['A.R. Rahman'],
        albumName: 'Jaane Tu... Ya Jaane Na',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/0U01AXKW4h78j4564357',
      },
      {
        id: `track2_${artistId}`,
        name: 'Tum Hi Ho',
        artists: ['Arijit Singh'],
        albumName: 'Aashiqui 2',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/698eCG4v436OI86ISg6DQ6',
      },
      {
        id: `track3_${artistId}`,
        name: 'Chaiyya Chaiyya',
        artists: ['A.R. Rahman'],
        albumName: 'Dil Se',
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/3m6dTq6p5rW8J8ZyQyQyQy',
      }
    ];
    return mockTracks;
  }

  const data = await response.json() as {
    tracks: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images?: Array<{ url: string }>;
      };
      preview_url?: string;
      external_urls: { spotify: string };
    }>;
  };

  return data.tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    albumName: track.album.name,
    imageUrl: track.album.images && track.album.images.length > 0 ? track.album.images[0].url : undefined,
    previewUrl: track.preview_url || undefined,
    spotifyUrl: track.external_urls.spotify,
  }));
}

/**
 * Calculate genre match score between seed artists and related artist
 */
function calculateGenreMatch(seedGenres: string[], relatedGenres: string[]): number {
  if (!seedGenres.length || !relatedGenres.length) return 0;

  let matchCount = 0;
  // Filter out undefined values and convert to lowercase
  const normalizedSeedGenres = seedGenres.filter(g => g).map(g => g.toLowerCase());
  const normalizedRelatedGenres = relatedGenres.filter(g => g).map(g => g.toLowerCase());

  for (const seedGenre of normalizedSeedGenres) {
    for (const relatedGenre of normalizedRelatedGenres) {
      // Exact match
      if (seedGenre === relatedGenre) {
        matchCount += 1;
      }
      // Partial match (e.g., "pop" matches "synthpop")
      else if (seedGenre.includes(relatedGenre) || relatedGenre.includes(seedGenre)) {
        matchCount += 0.5;
      }
    }
  }

  // Normalize to 0-1 range
  return Math.min(1, matchCount / Math.max(normalizedSeedGenres.length, 1));
}

/**
 * Calculate discovery score based on dial value and artist popularity
 */
function calculateDiscoveryScore(dialValue: number, artistPopularity: number, genreMatch: number = 0): number {
  // Dial value: 0 (comfort) to 100 (explorer)
  // Popularity: 0 (obscure) to 100 (mainstream)
  // Genre match: 0 (no match) to 1 (perfect match)
  
  // Base score from dial position
  const baseScore = dialValue;
  
  // Adjust based on artist popularity (inverse relationship)
  // Low popularity = higher discovery potential
  const popularityAdjustment = (100 - artistPopularity) * 0.3;
  
  // Adjust based on genre match (inverse relationship for discovery)
  // High genre match = lower discovery score (more familiar)
  const genreAdjustment = (1 - genreMatch) * 10;
  
  // Combine and normalize to 0-100
  const rawScore = baseScore + popularityAdjustment + genreAdjustment;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Simple feedback weights storage (in-memory for MVP)
 * In production, this would be stored in database
 */
const feedbackWeights: Map<string, { likes: number; dislikes: number }> = new Map();

/**
 * Apply feedback weight adjustment to discovery score
 */
function applyFeedbackWeight(trackId: string, baseScore: number): number {
  const feedback = feedbackWeights.get(trackId);
  if (!feedback) return baseScore;
  
  const totalFeedback = feedback.likes + feedback.dislikes;
  if (totalFeedback === 0) return baseScore;
  
  // Calculate net sentiment (-1 to 1)
  const sentiment = (feedback.likes - feedback.dislikes) / totalFeedback;
  
  // Adjust score based on sentiment (max ±10 points)
  const adjustment = sentiment * 10;
  
  return Math.min(100, Math.max(0, Math.round(baseScore + adjustment)));
}

/**
 * Update feedback weights for a track
 */
export function updateFeedbackWeights(trackId: string, isLiked: boolean): void {
  const current = feedbackWeights.get(trackId) || { likes: 0, dislikes: 0 };
  
  if (isLiked) {
    current.likes += 1;
  } else {
    current.dislikes += 1;
  }
  
  feedbackWeights.set(trackId, current);
}

/**
 * Generate recommendations based on dial value
 */
export async function generateRecommendations(
  accessToken: string,
  dialValue: number,
  limit: number = 15
): Promise<Recommendation[]> {
  const cacheKey = `${accessToken}_${dialValue}_${limit}`;
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.recommendations;
  }

  // Check if using mock token for testing
  const useMockMode = isMockMode || accessToken.startsWith('mock_') || accessToken.includes('mock');

  try {
    // Fetch user's top artists as seed
    const topArtists = await fetchTopArtists(accessToken, 5);
    const seedArtistNames = topArtists.map((a) => a.name);
    const seedGenres = topArtists.flatMap((a) => a.genres);
    
    const recommendations: Recommendation[] = [];
    const seenTrackIds = new Set<string>();
    
    // For each top artist, fetch related artists and their top tracks
    for (const artist of topArtists.slice(0, 3)) {
      try {
        const relatedArtists = await fetchRelatedArtists(accessToken, artist.id);
        
        for (const relatedArtist of relatedArtists.slice(0, 2)) {
          try {
            const tracks = await fetchArtistTopTracks(accessToken, relatedArtist.id);
            
            // Calculate genre match between seed and related artist
            const genreMatch = calculateGenreMatch(seedGenres, relatedArtist.genres);
            
            for (const track of tracks.slice(0, 2)) {
              if (seenTrackIds.has(track.id)) continue;
              seenTrackIds.add(track.id);
              
              const baseScore = calculateDiscoveryScore(dialValue, relatedArtist.popularity, genreMatch);
              const discoveryScore = applyFeedbackWeight(track.id, baseScore);
              const explanation = generateExplanation(track, discoveryScore, seedArtistNames);
              
              recommendations.push({
                ...track,
                discoveryScore,
                explanation,
              });
              
              if (recommendations.length >= limit) break;
            }
          } catch (error) {
            console.error(`Error fetching tracks for ${relatedArtist.name}:`, error);
          }
          
          if (recommendations.length >= limit) break;
        }
      } catch (error) {
        console.error(`Error fetching related artists for ${artist.name}:`, error);
      }
      
      if (recommendations.length >= limit) break;
    }
    
    // Sort by discovery score to match dial preference
    const sortedRecommendations = recommendations.sort((a, b) => {
      // For low dial values, prioritize lower discovery scores (more familiar)
      // For high dial values, prioritize higher discovery scores (more obscure)
      if (dialValue < 50) {
        return a.discoveryScore - b.discoveryScore;
      } else {
        return b.discoveryScore - a.discoveryScore;
      }
    });
    
    const result = sortedRecommendations.slice(0, limit);
    
    // Cache the results
    cache[cacheKey] = {
      recommendations: result,
      timestamp: Date.now(),
    };
    
    return result;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Clear recommendation cache (useful for testing or when user preferences change)
 */
export function clearRecommendationCache(): void {
  Object.keys(cache).forEach((key) => delete cache[key]);
}
