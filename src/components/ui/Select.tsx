interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

const Select = ({ label, error, id, className = '', children, ...props }: SelectProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`
        w-full border rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400
        disabled:opacity-50 disabled:bg-slate-50
        ${error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 hover:border-slate-300'}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-rose-500 text-xs">{error}</p>}
  </div>
);

export default Select;
