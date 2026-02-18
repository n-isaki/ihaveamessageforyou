import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FormSection({ 
  title, 
  description, 
  children, 
  defaultOpen = true,
  badge = null,
  className = "" 
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden transition-all duration-200 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-700">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {description && (
            <span className="text-sm text-stone-500 hidden sm:block">{description}</span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-stone-400 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone-400 transition-transform" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
      `}>
        <div className="p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
