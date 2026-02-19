
import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-in-right ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <p className="font-bold text-sm tracking-tight">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-70 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
