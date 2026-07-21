import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  spotifyUrl: string;
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTracks: any[];
  onPlaylistCreated: (playlist: Playlist) => void;
}

function CreatePlaylistModal({ isOpen, onClose, selectedTracks, onPlaylistCreated }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, userId } = useAuth();

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = userId
        ? `${backendUrl}/api/playlists?user_id=${userId}`
        : `${backendUrl}/api/playlists`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          description: description.trim() || undefined,
          trackIds: selectedTracks.map((t) => t.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create playlist');
      }

      const data = await response.json();
      onPlaylistCreated(data.playlist);
    } catch (err: any) {
      setError(err.message || 'Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Create Playlist</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Playlist Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Discovery Mix"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {selectedTracks.length} Track{selectedTracks.length !== 1 ? 's' : ''} Selected
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {(selectedTracks || []).slice(0, 5).map((track) => (
                    <div key={track.id} className="text-sm text-gray-300 truncate">
                      • {track.name} - {(track.artists || []).join(', ')}
                    </div>
                  ))}
                  {selectedTracks.length > 5 && (
                    <div className="text-sm text-gray-500 pl-2">
                      +{selectedTracks.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="px-6 py-2 bg-spotify-green text-black font-bold rounded-full hover:bg-emerald-500 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
              >
                {isLoading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Create Playlist'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PlaylistManager({ selectedTracks, onPlaylistCreated }: { selectedTracks: any[]; onPlaylistCreated: (playlist: any) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return null;

  const handleOpenModal = () => setIsModalOpen(true);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenModal}
            disabled={selectedTracks.length === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Playlist</span>
          </button>
          {user?.topTracks.length ? (
            <span className="text-xs text-gray-500">
              {user.topTracks.length} top tracks available
            </span>
          ) : null}
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTracks={selectedTracks}
        onPlaylistCreated={onPlaylistCreated}
      />
    </>
  );
}
