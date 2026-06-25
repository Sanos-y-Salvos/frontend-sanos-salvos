import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow active:scale-[0.98]',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98]',
  danger:    'bg-rose-500 text-white hover:bg-rose-600 shadow-sm hover:shadow active:scale-[0.98]',
  ghost:     'text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:scale-[0.98]',
  outline:   'border-2 border-brand-500 text-brand-700 hover:bg-brand-50 active:scale-[0.98]',
};

const sizes = {
  sm: 'py-1.5 px-3 text-xs gap-1.5',
  md: 'py-2.5 px-5 text-sm gap-2',
  lg: 'py-3 px-7 text-base gap-2',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`
      inline-flex items-center justify-center rounded-xl font-medium
      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
    `.trim()}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {children}
  </button>
);

export default Button;
