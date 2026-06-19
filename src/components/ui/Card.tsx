interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = false }: CardProps) => (
  <div
    className={`
      bg-white rounded-2xl border border-slate-100 shadow-sm
      ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
      ${className}
    `.trim()}
  >
    {children}
  </div>
);

export default Card;
