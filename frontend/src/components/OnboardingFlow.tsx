import { useState } from 'react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Discovery Dial',
      description: 'Your personal music discovery companion that helps you find new music you\'ll love.',
      icon: (
        <svg className="h-12 w-12 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Adjust the Discovery Dial',
      description: 'Use the slider to control how familiar or obscure your recommendations are. Start at 50 for a balanced mix.',
      icon: (
        <svg className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      title: 'Discover & Save',
      description: 'Like tracks you enjoy, create playlists, and expand your musical horizons with each spin.',
      icon: (
        <svg className="h-12 w-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
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

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="max-w-lg w-full">
        {/* Progress Indicators */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? 'bg-spotify-green' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-spotify-green/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 p-4 bg-white/5 rounded-2xl">
              {steps[currentStep].icon}
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-4">
              {steps[currentStep].title}
            </h2>

            <p className="text-lg text-gray-400 leading-relaxed max-w-md">
              {steps[currentStep].description}
            </p>

            {/* Step Numbers */}
            <div className="absolute top-6 right-6 text-sm font-bold text-gray-600">
              {currentStep + 1} / {steps.length}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Skip for now
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-3 bg-spotify-green text-black font-bold rounded-full hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-spotify-green/20"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
