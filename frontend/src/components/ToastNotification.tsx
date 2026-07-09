import { useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  useEffect(() => {
    // Auto-remove toasts after 5 seconds
    toasts.forEach((toast) => {
      if (toast.type !== 'info') {
        const timer = setTimeout(() => {
          onRemove(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, onRemove]);

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'info':
      default:
        return 'bg-white/5 border-white/10 text-gray-300';
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl border ${getStyles(
            toast.type
          )} backdrop-blur-sm shadow-lg shadow-black/20 animate-in slide-in-from-bottom-5 fade-in duration-300`}
        >
          <div className="flex-shrink-0">{getIcon(toast.type)}</div>
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
