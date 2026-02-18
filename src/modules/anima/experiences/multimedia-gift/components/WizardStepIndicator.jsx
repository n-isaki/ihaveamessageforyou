import React from 'react';
import { Check, Loader } from 'lucide-react';

export default function WizardStepIndicator({ step, projectType, totalSteps = 2 }) {
  const getStepConfig = (stepNumber) => {
    const isActive = step >= stepNumber;
    const isCompleted = step > stepNumber;
    
    const colors = {
      noor: {
        active: 'bg-emerald-500 border-emerald-500',
        completed: 'bg-emerald-500 border-emerald-500',
        inactive: 'bg-stone-100 border-stone-300'
      },
      memoria: {
        active: 'bg-stone-600 border-stone-600',
        completed: 'bg-stone-600 border-stone-600',
        inactive: 'bg-stone-100 border-stone-300'
      },
      ritual: {
        active: 'bg-indigo-500 border-indigo-500',
        completed: 'bg-indigo-500 border-indigo-500',
        inactive: 'bg-stone-100 border-stone-300'
      },
      default: {
        active: 'bg-rose-500 border-rose-500',
        completed: 'bg-rose-500 border-rose-500',
        inactive: 'bg-stone-100 border-stone-300'
      }
    };

    const theme = colors[projectType] || colors.default;
    
    return {
      bgColor: isCompleted ? theme.completed : isActive ? theme.active : theme.inactive,
      textColor: isActive ? 'text-white' : 'text-stone-500',
      borderColor: isCompleted ? theme.completed : isActive ? theme.active : theme.inactive
    };
  };

  const getStepLabel = (stepNumber) => {
    const labels = {
      1: 'Inhalte',
      2: 'Gestaltung'
    };
    return labels[stepNumber] || `Schritt ${stepNumber}`;
  };

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: projectType === 'noor' ? '#10b981' : 
                           projectType === 'memoria' ? '#4b5563' :
                           projectType === 'ritual' ? '#6366f1' : '#f43f5e'
            }}
          />
        </div>
      </div>

      {/* Step Circles */}
      <div className="flex justify-between relative">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const config = getStepConfig(stepNumber);
          const isCurrentStep = step === stepNumber;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center">
              <div className={`
                relative w-10 h-10 rounded-full border-2 transition-all duration-300
                flex items-center justify-center text-sm font-medium
                ${config.bgColor} ${config.textColor} ${config.borderColor}
                ${isCurrentStep ? 'ring-4 ring-opacity-20 ring-offset-2' : ''}
              `}
              style={{
                ringColor: projectType === 'noor' ? '#10b981' : 
                           projectType === 'memoria' ? '#4b5563' :
                           projectType === 'ritual' ? '#6366f1' : '#f43f5e'
              }}
              >
                {step > stepNumber ? (
                  <Check className="w-4 h-4" />
                ) : isCurrentStep ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={`
                mt-2 text-xs font-medium transition-colors
                ${step >= stepNumber ? 'text-stone-900' : 'text-stone-500'}
              `}>
                {getStepLabel(stepNumber)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
