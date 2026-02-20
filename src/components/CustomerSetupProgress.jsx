import React from 'react';
import { Edit3, Image, MessageSquare, Users } from 'lucide-react';

export default function CustomerSetupProgress({ 
  currentStep, 
  completedSteps = [], 
  giftType = 'mug',
  isLocked = false 
}) {
  const steps = [
    {
      id: 'basic',
      title: 'Grundlagen',
      description: 'Titel & Empfänger',
      icon: Edit3,
      required: true
    },
    {
      id: 'media',
      title: 'Medien',
      description: 'Fotos & Videos',
      icon: Image,
      required: giftType !== 'noor'
    },
    {
      id: 'messages',
      title: 'Nachrichten',
      description: 'Persönliche Worte',
      icon: MessageSquare,
      required: true
    },
    {
      id: 'social',
      title: 'Gemeinschaft',
      description: 'Freunde einladen',
      icon: Users,
      required: false
    }
  ];

  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (currentStep === stepId) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-stone-900/30 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-stone-800/30 mb-3 sm:mb-4">
      {/* Fortschritt: nur Schritt-Namen, ohne Progressbalken */}
      <div className="flex justify-between gap-1">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const _isActive = currentStep === step.id;
          
          return (
            <button
              key={step.id}
              onClick={() => !isLocked && /* scrollToStep(step.id) */ null}
              disabled={isLocked}
              className={`
                relative px-1 py-1 rounded text-[10px] sm:text-xs transition-all duration-200
                ${status === 'completed' ? 'text-emerald-400 font-medium' : ''}
                ${status === 'active' ? 'text-rose-400 font-semibold' : ''}
                ${status === 'pending' ? 'text-stone-500' : ''}
                ${!isLocked && status !== 'completed' ? 'hover:text-stone-300 cursor-pointer' : ''}
                ${isLocked ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">
                {step.id === 'basic' ? 'Grund' : 
                 step.id === 'media' ? 'Medien' : 
                 step.id === 'messages' ? 'Nachr' : 
                 step.id === 'social' ? 'Gemein' : step.title}
              </span>
              {status === 'completed' && (
                <span className="ml-0.5 text-[9px]">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
