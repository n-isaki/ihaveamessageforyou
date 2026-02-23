import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Lightbulb } from 'lucide-react';

export default function CustomerSetupSection({ 
  title, 
  description, 
  children, 
  defaultOpen = true,
  badge = null,
  icon = null,
  tips = [],
  isCompleted = false,
  isActive = false,
  onToggle = null
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`
      relative bg-white rounded-2xl border border-brand-border shadow-brand
      transition-all duration-300 mb-4 sm:mb-6
      ${isActive ? 'border-brand-patina/50 shadow-brand-lg' : ''}
      ${isCompleted ? 'border-emerald-500/30' : ''}
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 sm:p-6 cursor-pointer hover:bg-brand-cream-tint/50 transition-colors rounded-t-2xl"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {icon && <div className={`
            ${isActive ? 'text-brand-patina' : isCompleted ? 'text-emerald-500' : 'text-brand-text'}
            w-4 h-4 sm:w-5 sm:h-5 shrink-0
          `}>{icon}</div>}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold text-brand-anthracite flex flex-wrap items-center gap-2">
              {title}
              {isCompleted && <span className="text-xs bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0">✅</span>}
              {badge && (
                <span className="text-xs bg-brand-patina/20 text-brand-patina px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-brand-patina/30 shrink-0">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-brand-text mt-0.5 sm:mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {tips.length > 0 && (
            <div className="text-brand-text">
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-brand-text transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-brand-text transition-transform" />
          )}
        </div>
      </div>

      {/* Tips */}
      {isOpen && tips.length > 0 && (
        <div className="px-3 sm:px-6 pb-3 sm:pb-4">
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1 sm:space-y-2">
                {tips.map((tip, index) => (
                  <p key={index} className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content – direkter Container ohne contents */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-screen opacity-100 px-3 sm:px-6 pb-3 sm:pb-6' : 'max-h-0 opacity-0 overflow-hidden p-0'}
      `}>
        {children}
      </div>
    </div>
  );
}
