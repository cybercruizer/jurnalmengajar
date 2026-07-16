import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.15 } }}
            layout
            className="pointer-events-auto"
          >
            <div className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-slate-900/95 text-slate-100 border-emerald-500/30 ring-1 ring-emerald-500/10' 
                : 'bg-slate-900/95 text-slate-100 border-rose-500/30 ring-1 ring-rose-500/10'
            }`}>
              {toast.type === 'success' ? (
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-rose-500/15 text-rose-400 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 text-xs font-medium leading-relaxed pt-0.5">
                {toast.message}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
