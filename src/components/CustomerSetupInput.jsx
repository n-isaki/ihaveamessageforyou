import React from 'react';
import { Check, AlertCircle, Upload, Edit2, Trash2 } from 'lucide-react';

export default function CustomerSetupInput({ 
  label, 
  description, 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  error = null,
  success = false,
  required = false,
  icon = null,
  multiline = false,
  maxLength = null,
  showCharCount = false,
  disabled = false,
  accept = null,
  onFileUpload = null,
  uploading = false,
  previewUrl = null,
  onPreviewRemove = null,
  className = ""
}) {
  const InputComponent = multiline ? 'textarea' : 'input';
  const currentLength = value?.length || 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-stone-400">{icon}</div>}
          <label className="text-sm font-medium text-stone-300">
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        </div>
        
        {/* Status Icons */}
        <div className="flex items-center gap-2">
          {showCharCount && maxLength && (
            <span className={`
              text-xs
              ${currentLength > maxLength * 0.9 ? 'text-rose-400' : 'text-stone-500'}
            `}>
              {currentLength}/{maxLength}
            </span>
          )}
          {success && <Check className="w-4 h-4 text-emerald-500" />}
          {error && <AlertCircle className="w-4 h-4 text-rose-500" />}
        </div>
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
      )}
      
      {/* Input Field */}
      <div className="relative">
        {type === 'file' ? (
          /* File Upload */
          <div className="space-y-3">
            {previewUrl ? (
              /* Preview */
              <div className="relative group">
                <div className="w-full max-w-20 mx-auto aspect-[3/4] bg-stone-950 rounded-xl overflow-hidden border border-stone-700 shadow-xl">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                {!disabled && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {/* Replace Button */}
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-colors text-white border border-white/20">
                      <Edit2 className="h-5 w-5" />
                      <input
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={onFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    {/* Delete Button */}
                    {onPreviewRemove && (
                      <button
                        onClick={onPreviewRemove}
                        className="bg-red-500/80 hover:bg-red-600 p-3 rounded-full backdrop-blur-md transition-colors text-white shadow-lg"
                        title="Bild löschen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Upload Area */
              <label className={`
                flex flex-col items-center justify-center w-full h-24 
                border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${disabled ? 'border-stone-700 cursor-not-allowed' : 'border-stone-600 hover:border-rose-500/50 hover:bg-stone-800/30'}
              `}>
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={onFileUpload}
                  disabled={disabled || uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-stone-400 mt-2">Lädt hoch...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-sm text-stone-300">Bild auswählen</span>
                    {accept && (
                      <span className="text-xs text-stone-500 mt-1">
                        {accept.includes('image') ? 'JPG, PNG oder WebP' : accept}
                      </span>
                    )}
                  </>
                )}
              </label>
            )}
          </div>
        ) : (
          /* Text Input */
          <InputComponent
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            rows={multiline ? 4 : undefined}
            className={`
              w-full bg-stone-950 border border-stone-800 rounded-xl p-3 
              text-base text-white placeholder-stone-500
              focus:ring-2 focus:ring-stone-600 focus:border-stone-600 outline-none
              transition-all duration-200
              ${error ? 'border-rose-500 focus:ring-rose-500' : ''}
              ${success ? 'border-emerald-500 focus:ring-emerald-500' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${multiline ? 'min-h-[60px] resize-y' : 'h-12'}
            `}
          />
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
