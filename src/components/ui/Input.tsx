interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
}

const Input = ({ label, error, icon, id, className = '', ...props }: InputProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        id={id}
        className={`
          w-full border rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900
          placeholder:text-slate-400 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400
          disabled:opacity-50 disabled:bg-slate-50
          ${error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 hover:border-slate-300'}
          ${icon ? 'pl-10' : ''}
          ${className}
        `.trim()}
        {...props}
      />
    </div>
    {error && <p className="text-rose-500 text-xs">{error}</p>}
  </div>
);

export default Input;
