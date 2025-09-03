import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, Warning, Info } from "lucide-react";

export default function ProgressiveForm({ sections = [], onSubmit, className = "" }) {
  const [expandedSections, setExpandedSections] = useState(new Set([0])); // First section expanded by default
  const [completedSections, setCompletedSections] = useState(new Set());
  const [formData, setFormData] = useState({});

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const updateFormData = (sectionId, fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  const validateSection = (section) => {
    const sectionData = formData[section.id] || {};
    return section.fields.every(field => {
      if (field.required) {
        const value = sectionData[field.name];
        return value !== undefined && value !== "" && value !== null;
      }
      return true;
    });
  };

  const handleSectionComplete = (sectionIndex) => {
    const section = sections[sectionIndex];
    if (validateSection(section)) {
      const newCompleted = new Set(completedSections);
      newCompleted.add(sectionIndex);
      setCompletedSections(newCompleted);
      
      // Auto-expand next section
      if (sectionIndex + 1 < sections.length) {
        const newExpanded = new Set(expandedSections);
        newExpanded.add(sectionIndex + 1);
        setExpandedSections(newExpanded);
      }
    }
  };

  const getSectionStatus = (index) => {
    if (completedSections.has(index)) return 'completed';
    if (expandedSections.has(index)) return 'active';
    return 'pending';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allValid = sections.every(section => validateSection(section));
    if (allValid) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`progressive-form ${className}`}>
      <div className="space-y-4">
        {sections.map((section, index) => {
          const status = getSectionStatus(index);
          const isExpanded = expandedSections.has(index);
          const isCompleted = completedSections.has(index);
          const isValid = validateSection(section);

          return (
            <div
              key={section.id}
              className={`border rounded-xl transition-all duration-200 ${
                status === 'completed' 
                  ? 'border-green-200 bg-green-50/50' 
                  : status === 'active'
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-600'
                      : status === 'active'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Section Info */}
                  <div>
                    <h3 className={`font-semibold ${
                      isCompleted ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex items-center gap-2">
                  {!isValid && isExpanded && (
                    <Warning className="w-4 h-4 text-amber-500" />
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 animate-in slide-in-from-top duration-200">
                  {section.fields.map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      value={formData[section.id]?.[field.name] || ""}
                      onChange={(value) => updateFormData(section.id, field.name, value)}
                    />
                  ))}

                  {/* Section Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSection(index - 1)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSectionComplete(index)}
                      disabled={!isValid}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isValid
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {index === sections.length - 1 ? 'Complete' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Submit */}
      {completedSections.size === sections.length && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-800 mb-3">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Ready to Submit</span>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Submit Form
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${(completedSections.size / sections.length) * 100}%` 
          }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2 text-center">
        {completedSections.size} of {sections.length} sections completed
      </p>
    </form>
  );
}

function FormField({ field, value, onChange }) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows || 3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span>{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {field.help && (
        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{field.help}</span>
        </div>
      )}
    </div>
  );
}