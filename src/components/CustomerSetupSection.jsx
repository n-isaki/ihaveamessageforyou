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
      relative bg-stone-900/40 backdrop-blur-sm rounded-2xl 
      border transition-all duration-300 mb-4 sm:mb-6
      ${isActive ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-stone-800/50'}
      ${isCompleted ? 'border-emerald-500/30' : ''}
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 sm:p-6 cursor-pointer hover:bg-stone-800/30 transition-colors rounded-t-2xl"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {icon && <div className={`
            ${isActive ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-stone-400'}
            w-4 h-4 sm:w-5 sm:h-5 shrink-0
          `}>{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
              {title}
              {isCompleted && <span className="text-xs bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">✅</span>}
              {badge && (
                <span className="text-xs bg-rose-500/20 text-rose-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-rose-500/30">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5 sm:mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {tips.length > 0 && (
            <div className="text-stone-500">
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 transition-transform" />
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

      {/* Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
      `}>
        <div className="px-3 sm:px-6 pb-3 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
