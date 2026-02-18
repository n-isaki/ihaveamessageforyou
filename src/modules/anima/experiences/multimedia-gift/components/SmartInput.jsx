import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export default function SmartInput({ 
  label, 
  description, 
  error, 
  success, 
  required = false,
  icon = null,
  className = "",
  children 
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      <div className="flex items-center gap-2">
        {icon && <div className="text-stone-400">{icon}</div>}
        <label className="block text-sm font-medium text-stone-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {success && <Check className="w-4 h-4 text-green-500" />}
        {error && <AlertCircle className="w-4 h-4 text-rose-500" />}
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-xs text-stone-500">{description}</p>
      )}
      
      {/* Input Field */}
      <div className="relative">
        {children}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
