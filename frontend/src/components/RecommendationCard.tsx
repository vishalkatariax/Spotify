import { useState } from 'react';

interface RecommendationCardProps {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  imageUrl?: string;
  previewUrl?: string;
  spotifyUrl: string;
  discoveryScore: number;
  explanation: string;
  onLike?: (id: string) => void;
  onDislike?: (id: string) => void;
}

export default function RecommendationCard({
  id,
  name,
  artists,
  albumName,
  imageUrl,
  previewUrl,
  spotifyUrl,
  discoveryScore,
  explanation,
  onLike,
  onDislike,
}: RecommendationCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handlePlayPreview = () => {
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setDisliked(false);
    if (onLike) onLike(id);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    setLiked(false);
    if (onDislike) onDislike(id);
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'from-green-500 to-emerald-500';
    if (score < 50) return 'from-yellow-500 to-orange-500';
    if (score < 70) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-purple-500';
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return 'Familiar';
    if (score < 50) return 'Balanced';
    if (score < 70) return 'Adventurous';
    return 'Deep Discovery';
  };

  return (
    <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-start space-x-4">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={albumName}
              className="h-16 w-16 rounded-lg object-cover border border-white/5"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-neutral-800 flex items-center justify-center text-xs text-gray-400 border border-white/5">
              No Art
            </div>
          )}
          {previewUrl && (
            <button
              onClick={handlePlayPreview}
              className="absolute -bottom-2 -right-2 h-8 w-8 bg-spotify-green rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
              title="Play preview"
            >
              {isPlaying ? (
                <svg className="h-4 w-4 text-black fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-black fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate group-hover:text-spotify-green transition-colors">
                {name}
              </h4>
              <p className="text-xs text-gray-400 truncate mt-0.5">{artists.join(', ')}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{albumName}</p>
            </div>
            
            {/* Discovery Score Badge */}
            <div className="flex-shrink-0 ml-3">
              <div
                className={`px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(
                  discoveryScore
                )} text-black text-xs font-bold`}
              >
                {discoveryScore}
              </div>
              <div className="text-[9px] text-gray-500 text-center mt-0.5 uppercase tracking-wider">
                {getScoreLabel(discoveryScore)}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
            {explanation}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`p-1.5 rounded-lg transition-colors ${
                  liked ? 'bg-spotify-green/20 text-spotify-green' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                title="Like"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button
                onClick={handleDislike}
                className={`p-1.5 rounded-lg transition-colors ${
                  disliked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                title="Dislike"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </button>
            </div>

            <a
              href={spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-spotify-green hover:text-emerald-400 transition-colors flex items-center space-x-1"
            >
              <span>Open in Spotify</span>
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
