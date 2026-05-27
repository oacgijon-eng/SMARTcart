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
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

  const variants = {
    primary: "bg-gradient-to-tr from-clinical-600 to-teal-400 text-white hover:from-clinical-700 hover:to-teal-500 shadow-md shadow-clinical-100 dark:shadow-none hover:shadow-lg focus:ring-clinical-500",
    secondary: "bg-clinical-50/70 text-clinical-700 hover:bg-clinical-100/50 dark:bg-clinical-950/20 dark:text-clinical-300 dark:hover:bg-clinical-900/40 border border-clinical-100 dark:border-clinical-900/40 focus:ring-clinical-500",
    outline: "border border-slate-200 dark:border-slate-700 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-500",
    danger: "bg-gradient-to-tr from-red-500 to-rose-400 text-white hover:from-red-600 hover:to-rose-500 shadow-md shadow-red-200 dark:shadow-none hover:shadow-lg focus:ring-red-500",
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
      className={`glass-card rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
        onClick 
          ? 'cursor-pointer hover:border-clinical-400 dark:hover:border-clinical-400 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] glow-hover' 
          : ''
      } ${className}`}
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
    <div className="bg-white/45 dark:bg-night-card/45 backdrop-blur-xl border-b border-white/20 dark:border-white/5 sticky top-0 z-20 px-4 pb-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm pt-[calc(1rem+env(safe-area-inset-top))]">

      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-deep-blue dark:text-white tracking-wide">{title}</h1>
          {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">{subtitle}</p>}
        </div>

      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  noPadding?: boolean;
  allowOverflow?: boolean;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', noPadding = false, allowOverflow = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`bg-white/80 dark:bg-night-card/75 backdrop-blur-2xl rounded-2xl shadow-2xl w-full ${maxWidth} relative z-10 ${allowOverflow ? '' : 'overflow-hidden'} animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-slate-700/50`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
          <h3 className="font-bold font-heading text-lg text-deep-blue dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">

            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className={noPadding ? "" : "p-6"}>
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