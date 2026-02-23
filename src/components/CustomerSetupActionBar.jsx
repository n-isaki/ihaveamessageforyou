import React from 'react';
import { Save, Lock, Eye, Share2, Loader } from 'lucide-react';

export default function CustomerSetupActionBar({ 
  onSaveDraft, 
  onSaveAndLock, 
  saving = false,
  canSave = true,
  canLock = false,
  progressPercentage = 0
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-brand-cream/95 backdrop-blur-xl border-t border-brand-border z-30">
      <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar - More Compact */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-brand-text mb-0.5 sm:mb-1">
              <span>Fortschritt</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-0.5 bg-brand-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-patina transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 sm:gap-2 justify-center">
            {/* Save Draft Button */}
            <button
              onClick={onSaveDraft}
              disabled={saving || !canSave}
              className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
              ) : (
                <>
                  <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">Entwurf speichern</span>
                  <span className="xs:hidden">Entwurf</span>
                </>
              )}
            </button>

            {/* Save & Lock Button */}
            <button
              onClick={onSaveAndLock}
              disabled={saving || !canLock}
              className={`
                flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-[10px] sm:text-sm
                ${canLock 
                  ? 'btn-primary shadow-brand' 
                  : 'bg-brand-cream-tint text-brand-text cursor-not-allowed border border-brand-border'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {saving ? (
                <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-white/50" />
              ) : (
                <>
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Versiegeln</span>
                  <span className="xs:hidden">Versiegeln</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
