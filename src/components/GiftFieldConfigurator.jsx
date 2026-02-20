import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { FIELD_CONFIG, isFieldEnabled, isFieldRequired } from '../config/customerSetupFields';
import { 
  saveGiftFieldConfig, 
  getGiftFieldConfig, 
  deleteGiftFieldConfig, 
  getAllGiftConfigs 
} from '../config/giftFieldConfigurations';

export default function GiftFieldConfigurator({ giftId, onClose }) {
  const [projectType, setProjectType] = useState('mug');
  const [fieldConfig, setFieldConfig] = useState(FIELD_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState({});

  useEffect(() => {
    // Load existing config for this gift (sync setState in effect: initial load from storage)
    const existingConfig = getGiftFieldConfig(giftId);
    if (existingConfig) {
      /* eslint-disable react-hooks/set-state-in-effect -- initial load from localStorage */
      setFieldConfig(existingConfig);
      /* eslint-enable react-hooks/set-state-in-effect */
      // Extract project type from the first enabled field
      const firstEnabledField = Object.values(existingConfig).find(category => 
        Object.values(category).find(field => field.enabled?.includes(projectType))
      );
      if (firstEnabledField) {
        const enabledField = Object.values(firstEnabledField).find(field => 
          field.enabled?.includes(projectType)
        );
        if (enabledField) {
          setProjectType(enabledField.enabled[0]);
        }
      }
    }
    
    // Load all saved configs
    setSavedConfigs(getAllGiftConfigs());
  }, [giftId]);

  const toggleField = (category, field) => {
    const newConfig = { ...fieldConfig };
    const currentEnabled = [...(newConfig[category][field].enabled || [])];
    
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
    const currentRequired = [...(newConfig[category][field].required || [])];
    
    if (currentRequired.includes(projectType)) {
      newConfig[category][field].required = currentRequired.filter(p => p !== projectType);
    } else {
      newConfig[category][field].required = [...currentRequired, projectType];
    }
    
    setFieldConfig(newConfig);
    setHasChanges(true);
  };

  const saveConfig = () => {
    saveGiftFieldConfig(giftId, fieldConfig);
    setHasChanges(false);
    
    // Update saved configs list
    const updatedConfigs = { ...savedConfigs };
    updatedConfigs[giftId] = fieldConfig;
    setSavedConfigs(updatedConfigs);
    
    alert('Konfiguration für dieses Geschenk gespeichert!');
  };

  const resetToDefault = () => {
    setFieldConfig(FIELD_CONFIG);
    setHasChanges(true);
  };

  const _deleteConfig = () => {
    if (confirm(`Möchtest du die Konfiguration für Geschenk ${giftId} wirklich löschen?`)) {
      deleteGiftFieldConfig(giftId);
      setFieldConfig(FIELD_CONFIG);
      setHasChanges(false);
      
      const updatedConfigs = { ...savedConfigs };
      delete updatedConfigs[giftId];
      setSavedConfigs(updatedConfigs);
    }
  };

  const loadConfig = (targetGiftId) => {
    const config = getGiftFieldConfig(targetGiftId);
    if (config) {
      setFieldConfig(config);
      setHasChanges(false);
      
      // Extract project type
      const firstEnabledField = Object.values(config).find(category => 
        Object.values(category).find(field => field.enabled?.includes(projectType))
      );
      if (firstEnabledField) {
        const enabledField = Object.values(firstEnabledField).find(field => 
          field.enabled?.includes(projectType)
        );
        if (enabledField) {
          setProjectType(enabledField.enabled[0]);
        }
      }
    }
  };

  const exportConfig = () => {
    const configData = {
      giftId,
      projectType,
      configuration: fieldConfig,
      timestamp: new Date().toISOString()
    };
    
    const configString = JSON.stringify(configData, null, 2);
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift-${giftId}-field-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configData = JSON.parse(e.target.result);
          if (configData.configuration) {
            setFieldConfig(configData.configuration);
            setProjectType(configData.projectType || 'mug');
            setHasChanges(true);
            alert('Konfiguration importiert!');
          }
        } catch (error) {
          alert('Fehler beim Importieren der Konfiguration');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  };

  const currentFields = Object.entries(fieldConfig).map(([category, fields]) => ({
    category,
    fields: Object.entries(fields).map(([fieldKey, field]) => ({
      key: fieldKey,
      ...field,
      enabled: isFieldEnabled(category, fieldKey, projectType),
      required: isFieldRequired(category, fieldKey, projectType)
    }))
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-stone-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <div>
            <h2 className="text-xl font-bold text-white">Feldkonfiguration</h2>
            <p className="text-sm text-stone-400 mt-1">Geschenk: {giftId}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            )}
            <button
              onClick={exportConfig}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => document.getElementById('import-file').click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 p-6 border-r border-stone-800 overflow-y-auto">
            {/* Project Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Projekttyp</h3>
              <div className="grid grid-cols-2 gap-2">
                {['mug', 'bracelet', 'memoria', 'noor'].map(type => (
                  <button
                    key={type}
                    onClick={() => setProjectType(type)}
                    className={`p-3 rounded-lg border transition-all ${
                      projectType === type
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    <div className="font-medium capitalize">{type}</div>
                    <div className="text-xs opacity-80">
                      {type === 'mug' && 'Tasse'}
                      {type === 'bracelet' && 'Armband'}
                      {type === 'memoria' && 'Memoria'}
                      {type === 'noor' && 'Noor'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Configuration */}
            <div className="space-y-6">
              {currentFields.map(({ category, fields }) => (
                <div key={category}>
                  <h3 className="text-md font-semibold text-stone-300 mb-4">
                    {category === 'basic' && 'Grundinformationen'}
                    {category === 'media' && 'Medien'}
                    {category === 'access' && 'Zugangskontrolle'}
                    {category === 'messages' && 'Nachrichten'}
                    {category === 'social' && 'Social Gifting'}
                  </h3>
                  
                  <div className="space-y-3">
                    {fields.map(field => (
                      <div key={field.key} className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-white">{field.label}</h4>
                            <p className="text-sm text-stone-400">{field.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleField(category, field.key)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                                field.enabled
                                  ? 'bg-green-600 text-white'
                                  : 'bg-stone-700 text-stone-400'
                              }`}
                            >
                              {field.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {field.enabled ? 'Sichtbar' : 'Ausgeblendet'}
                            </button>
                            
                            {field.enabled && (
                              <button
                                onClick={() => toggleRequired(category, field.key)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                                  field.required
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-stone-700 text-stone-400'
                                }`}
                              >
                                {field.required ? 'Pflicht' : 'Optional'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Saved Configurations */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Gespeicherte Konfigurationen</h3>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 transition-all text-sm"
              >
                <Settings className="w-3 h-3" />
                Zurücksetzen
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(savedConfigs).length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  Noch keine Konfigurationen gespeichert
                </div>
              ) : (
                Object.entries(savedConfigs).map(([savedGiftId, config]) => (
                  <div
                    key={savedGiftId}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      savedGiftId === giftId
                        ? 'bg-rose-900/30 border-rose-600/50'
                        : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
                    }`}
                    onClick={() => loadConfig(savedGiftId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{savedGiftId}</span>
                      {savedGiftId === giftId && (
                        <span className="text-xs bg-rose-600 text-white px-2 py-1 rounded">Aktuell</span>
                      )}
                    </div>
                    
                    {/* Show first few enabled fields as preview */}
                    <div className="text-xs text-stone-400">
                      {Object.entries(config).slice(0, 2).map(([category, fields]) => {
                        const enabledFields = Object.entries(fields).filter(([, field]) => 
                          field.enabled?.includes(projectType)
                        );
                        return (
                          <div key={category} className="mb-1">
                            <span className="font-medium text-stone-300 capitalize">{category}:</span> {enabledFields.length} Felder
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
