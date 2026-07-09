import { useState } from 'react';

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'basics' | 'dial' | 'playlists'>('basics');

  if (!isOpen) return null;

  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'dial', label: 'Discovery Dial' },
    { id: 'playlists', label: 'Playlists' },
  ];

  const content = {
    basics: {
      title: 'Getting Started',
      text: 'Welcome to Discovery Dial! This application helps you discover new music based on your Spotify listening history. Simply connect with Spotify to get personalized recommendations.',
      tips: [
        'Click "Connect with Spotify" to授权 access your listening data',
        'Your top tracks and artists are used to generate recommendations',
        'The Discovery Dial controls how familiar or obscure your results are',
      ],
    },
    dial: {
      title: 'Discovery Dial Guide',
      text: 'The Discovery Dial allows you to control the balance between familiar and obscure recommendations.',
      presets: [
        { name: 'Comfort Zone (0-30)', desc: 'Similar to your favorite artists' },
        { name: 'Balanced (30-70)', desc: 'Mix of familiar and new sounds' },
        { name: 'Deep Explorer (70-100)', desc: 'Discover truly obscure tracks' },
      ],
      tips: [
        'Start at 50 for a good balance',
        'Move left for more familiar recommendations',
        'Move right to discover new artists and genres',
      ],
    },
    playlists: {
      title: 'Creating Playlists',
      text: 'Save your favorite recommendations directly to Spotify playlists.',
      steps: [
        'Select tracks you like using the like button',
        'Click "Create Playlist" button',
        'Name your playlist and add a description',
        'Your tracks will be added automatically',
      ],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <svg className="h-6 w-6 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>How to Use Discovery Dial</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/5 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-spotify-green' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-spotify-green rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">{content[activeTab].title}</h3>
            <p className="text-gray-300 leading-relaxed">{content[activeTab].text}</p>
          </div>

          {activeTab === 'dial' && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Preset Values</h4>
              <div className="grid grid-cols-1 gap-3">
                {content[activeTab].presets.map((preset, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="font-semibold text-white">{preset.name}</p>
                    <p className="text-sm text-gray-400">{preset.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Steps to Create Playlist</h4>
              <div className="space-y-3">
                {content[activeTab].steps.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-spotify-green/20 text-spotify-green rounded-full flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'basics' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Quick Tips</h4>
              <ul className="space-y-2">
                {content[activeTab].tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-spotify-green mt-1">•</span>
                    <span className="text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
