import React, { useState } from 'react';
import { Eye, EyeOff, Save, RotateCcw, Settings, Check, X } from 'lucide-react';
import { FIELD_CONFIG, isFieldEnabled, isFieldRequired, getEnabledFields } from '../config/customerSetupFields';

export default function AdminExperienceDesigner() {
  const [projectType, setProjectType] = useState('mug');
  const [fieldConfig, setFieldConfig] = useState(FIELD_CONFIG);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const currentFields = getEnabledFields(projectType);

  const toggleField = (category, field) => {
    const newConfig = { ...fieldConfig };
    const currentEnabled = [...newConfig[category][field].enabled];
    
    if (currentEnabled.includes(projectType)) {
      newConfig[category][field].enabled = currentEnabled.filter(p => p !== projectType);
    } else {
      newConfig[category][field].enabled = [...currentEnabled, projectType];
    }
    
    setFieldConfig(newConfig);
    setHasChanges(true);
  };

  const toggleRequired = (category, field) => {
    const newConfig = { ...fieldConfig };
    const currentRequired = [...newConfig[category][field].required];
    
    if (currentRequired.includes(projectType)) {
      newConfig[category][field].required = currentRequired.filter(p => p !== projectType);
    } else {
      newConfig[category][field].required = [...currentRequired, projectType];
    }
    
    setFieldConfig(newConfig);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    setFieldConfig(FIELD_CONFIG);
    setHasChanges(false);
  };

  const saveConfig = () => {
    // In a real implementation, this would save to backend
    console.log('Saving field configuration:', fieldConfig);
    alert('Konfiguration gespeichert!');
    setHasChanges(false);
  };

  const exportConfig = () => {
    const configString = JSON.stringify(fieldConfig, null, 2);
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-setup-fields-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const projectTypes = ['mug', 'bracelet', 'memoria', 'noor'];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-stone-900 rounded-2xl p-6 mb-6 border border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">CustomerSetup Experience Designer</h1>
              <p className="text-stone-400">Konfiguriere, welche Felder für jeden Projekttyp sichtbar sind</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  previewMode 
                    ? 'bg-rose-600 text-white border-rose-500' 
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {previewMode ? 'Vorschau' : 'Konfiguration'}
              </button>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Zurücksetzen
              </button>
              {hasChanges && (
                <button
                  onClick={saveConfig}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white border border-green-500 hover:bg-green-500 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
              )}
            </div>
          </div>
        </div>

        {!previewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Type Selector */}
            <div className="lg:col-span-1">
              <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Projekttyp
                </h2>
                <div className="space-y-2">
                  {projectTypes.map(type => (
                    <label key={type} className="flex items-center gap-3 p-3 rounded-lg border border-stone-700 hover:bg-stone-800 transition-all cursor-pointer">
                      <input
                        type="radio"
                        name="projectType"
                        value={type}
                        checked={projectType === type}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-4 h-4 text-rose-500"
                      />
                      <div>
                        <div className="font-medium text-white capitalize">{type}</div>
                        <div className="text-sm text-stone-400">
                          {type === 'mug' && 'Tassen-Geschenke'}
                          {type === 'bracelet' && 'Armband-Geschenke'}
                          {type === 'memoria' && 'Memoria-Gedenkstätten'}
                          {type === 'noor' && 'Noor-Erlebnisse'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Field Configuration */}
            <div className="lg:col-span-2">
              <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
                <h2 className="text-lg font-semibold text-white mb-6">Feldkonfiguration für {projectType}</h2>
                
                {Object.entries(currentFields).map(([category, fields]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-md font-semibold text-stone-300 mb-4 capitalize">
                      {category === 'basic' && 'Grundinformationen'}
                      {category === 'media' && 'Medien'}
                      {category === 'access' && 'Zugangskontrolle'}
                      {category === 'messages' && 'Nachrichten'}
                      {category === 'social' && 'Social Gifting'}
                    </h3>
                    
                    <div className="space-y-3">
                      {Object.entries(fields).map(([fieldKey, field]) => (
                        <div key={fieldKey} className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-white">{field.label}</h4>
                              <p className="text-sm text-stone-400">{field.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleField(category, fieldKey)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                                  isFieldEnabled(category, fieldKey, projectType)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-stone-700 text-stone-400'
                                }`}
                              >
                                {isFieldEnabled(category, fieldKey, projectType) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {isFieldEnabled(category, fieldKey, projectType) ? 'Sichtbar' : 'Ausgeblendet'}
                              </button>
                              
                              {isFieldEnabled(category, fieldKey, projectType) && (
                                <button
                                  onClick={() => toggleRequired(category, fieldKey)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                                    isFieldRequired(category, fieldKey, projectType)
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-stone-700 text-stone-400'
                                  }`}
                                >
                                  {isFieldRequired(category, fieldKey, projectType) ? 'Pflicht' : 'Optional'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {field.placeholder && (
                            <p className="text-xs text-stone-500 mt-2">
                              Platzhalter: "{field.placeholder}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="bg-stone-900 rounded-2xl p-8 border border-stone-800">
            <h2 className="text-xl font-semibold text-white mb-6">Vorschau: CustomerSetup für {projectType}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(currentFields).map(([category, fields]) => (
                <div key={category} className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                  <h3 className="text-lg font-semibold text-white mb-4 capitalize">
                    {category === 'basic' && 'Grundinformationen'}
                    {category === 'media' && 'Medien'}
                    {category === 'access' && 'Zugangskontrolle'}
                    {category === 'messages' && 'Nachrichten'}
                    {category === 'social' && 'Social Gifting'}
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(fields).map(([fieldKey, field]) => (
                      <div key={fieldKey} className={`p-3 rounded-lg border ${
                        field.required 
                          ? 'bg-orange-900/30 border-orange-600/50' 
                          : 'bg-stone-900/50 border-stone-600/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            field.required ? 'bg-orange-500' : 'bg-green-500'
                          }`} />
                          <span className="font-medium text-white">{field.label}</span>
                        </div>
                        <p className="text-sm text-stone-400">{field.description}</p>
                        {field.required && (
                          <p className="text-xs text-orange-400 mt-1">• Pflichtfeld</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={exportConfig}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all"
              >
                <Save className="w-4 h-4" />
                Konfiguration exportieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
