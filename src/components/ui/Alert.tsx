interface AlertProps {
  variant: 'error' | 'success';
  children: React.ReactNode;
  className?: string;
}

const styles = {
  error: 'bg-red-50 border border-red-200 text-red-600',
  success: 'bg-green-50 border border-green-200 text-green-600',
};

const Alert = ({ variant, children, className = '' }: AlertProps) => (
  <div className={`rounded-lg px-4 py-3 text-sm ${styles[variant]} ${className}`}>
    {children}
  </div>
);

export default Alert;
