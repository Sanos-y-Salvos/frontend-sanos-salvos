import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  variant: 'error' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

const config = {
  error:   { cls: 'bg-rose-50 border-rose-200 text-rose-700',   Icon: AlertCircle,   iconCls: 'text-rose-500'   },
  success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: CheckCircle, iconCls: 'text-emerald-500' },
  info:    { cls: 'bg-brand-50 border-brand-200 text-brand-700', Icon: Info,          iconCls: 'text-brand-500'  },
  warning: { cls: 'bg-amber-50 border-amber-200 text-amber-700', Icon: AlertTriangle, iconCls: 'text-amber-500'  },
};

const Alert = ({ variant, children, className = '' }: AlertProps) => {
  const { cls, Icon, iconCls } = config[variant];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconCls}`} />
      <span>{children}</span>
    </div>
  );
};

export default Alert;
