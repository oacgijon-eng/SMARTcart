import React from 'react';

// --- Types ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

// --- Components ---

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-clinical-600 text-white hover:bg-clinical-700 focus:ring-clinical-500 shadow-sm dark:bg-clinical-600 dark:hover:bg-clinical-700 active:scale-95",
    secondary: "bg-teal-100 text-teal-900 hover:bg-teal-200 focus:ring-teal-500 dark:bg-teal-900/30 dark:text-teal-200 dark:hover:bg-teal-900/50",
    outline: "border-2 border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  };


  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg",
    xl: "h-20 px-10 text-xl font-bold",
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }> = ({ children, className = '', onClick, style }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-light-gray-blue dark:bg-night-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md hover:border-clinical-300 dark:hover:border-clinical-500 transition-all active:scale-[0.98]' : ''} ${className}`}

      style={style}
    >
      {children}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'orange' | 'green' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    orange: "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    gray: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  };


  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; onBack?: () => void; action?: React.ReactNode }> = ({ title, subtitle, onBack, action }) => {
  return (
    <div className="bg-light-gray-blue dark:bg-night-card border-b border-white dark:border-slate-700 sticky top-0 z-20 px-4 pb-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm pt-[calc(1rem+env(safe-area-inset-top))]">

      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">

            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-deep-blue dark:text-white">{title}</h1>
          {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>

      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`bg-light-gray-blue dark:bg-night-card rounded-2xl shadow-xl w-full ${maxWidth} relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold font-heading text-lg text-deep-blue dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">

            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        className={`w-full rounded-xl border-slate-200 dark:border-slate-600 dark:bg-night-bg dark:text-white focus:border-clinical-500 focus:ring-clinical-500 transition-colors ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}

        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};