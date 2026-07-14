import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { login } = useAuth();

  const steps = [
    {
      title: 'Welcome to Discovery Dial',
      description: 'Your personalized music discovery companion that helps you find new music based on your taste.',
      content: (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
            <span className="text-black font-black text-3xl">DD</span>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            We use your Spotify listening history to generate personalized recommendations that match your musical preferences.
          </p>
        </div>
      ),
    },
    {
      title: 'How It Works',
      description: 'Adjust the Discovery Dial to control how familiar or obscure your recommendations are.',
      content: (
        <div className="text-center py-8">
          <div className="bg-[#181818] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-400">Comfort</span>
              <span className="text-sm font-semibold text-gray-400">Explorer</span>
            </div>
            <div className="w-full h-2 bg-[#282828] rounded-full mb-4">
              <div className="w-1/2 h-full bg-gradient-to-r from-green-500 to-purple-500 rounded-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-spotify-green font-bold mb-1">0-40</div>
                <div className="text-gray-400">Familiar favorites</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold mb-1">40-60</div>
                <div className="text-gray-400">Balanced mix</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold mb-1">60-100</div>
                <div className="text-gray-400">Deep discoveries</div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Slide left for music similar to what you already love. Slide right to discover hidden gems and new artists.
          </p>
        </div>
      ),
    },
    {
      title: 'Connect Your Music',
      description: 'Link your Spotify account to get personalized recommendations based on your listening history.',
      content: (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1DB954] flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            We'll analyze your top artists and tracks to find music that matches your unique taste.
          </p>
          <button
            onClick={login}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Connect with Spotify
          </button>
          <p className="text-gray-500 text-sm mt-4">
            We only read your listening history. We never post on your behalf.
          </p>
        </div>
      ),
    },
    {
      title: 'You\'re All Set!',
      description: 'Your personalized music discovery journey begins now.',
      content: (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Your Discovery Dial is ready! Start exploring new music tailored just for you.
          </p>
          <button
            onClick={() => {
              window.location.href = 'https://open.spotify.com';
            }}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Go to Spotify
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Or close this tab to continue using Discovery Dial
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-[#282828] rounded-full">
            <div
              className="h-full bg-[#1DB954] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#181818] rounded-2xl p-8 sm:p-12 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{steps[currentStep].title}</h1>
          <p className="text-gray-400 text-lg mb-8">{steps[currentStep].description}</p>
          
          {steps[currentStep].content}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                currentStep === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-6 rounded-full transition-all hover:scale-105"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Skip Button */}
        {currentStep < steps.length - 1 && (
          <button
            onClick={onComplete}
            className="mt-4 w-full text-center text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Skip onboarding
          </button>
        )}
      </div>
    </div>
  );
}
