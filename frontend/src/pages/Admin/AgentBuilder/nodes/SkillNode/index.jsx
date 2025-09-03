import React, { useState, useEffect } from "react";
import Admin from "@/models/admin";
import { defaultSkills, configurableSkills } from "@/pages/Admin/Agents/skills";

export default function SkillNode({
  config,
  onConfigChange,
  renderVariableSelect,
}) {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableSkills();
  }, []);

  const fetchAvailableSkills = async () => {
    try {
      // Fetch enabled skills from system preferences
      const res = await Admin.systemPreferencesByFields([
        "default_agent_skills",
        "disabled_agent_skills",
        "imported_agent_skills"
      ]);
      
      const enabledSkills = res?.settings?.default_agent_skills || [];
      const disabledSkills = res?.settings?.disabled_agent_skills || [];
      const importedSkills = res?.settings?.imported_agent_skills || [];
      
      // Build skills list from default skills
      const skills = [];
      
      // Add default skills that are not disabled
      Object.entries(defaultSkills).forEach(([key, skill]) => {
        if (!disabledSkills.includes(key)) {
          skills.push({
            id: key,
            label: skill.title,
            description: skill.description
          });
        }
      });
      
      // Add configurable skills that are enabled
      Object.entries(configurableSkills).forEach(([key, skill]) => {
        if (enabledSkills.includes(key)) {
          skills.push({
            id: key,
            label: skill.title,
            description: skill.description
          });
        }
      });
      
      // Add imported skills
      importedSkills.forEach(skill => {
        skills.push({
          id: skill.name,
          label: skill.name,
          description: skill.description || "Imported skill"
        });
      });

      setAvailableSkills(skills);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
      
      // Fallback to showing all available skills
      const allSkills = [];
      Object.entries({ ...defaultSkills, ...configurableSkills }).forEach(([key, skill]) => {
        allSkills.push({
          id: key,
          label: skill.title,
          description: skill.description
        });
      });
      setAvailableSkills(allSkills);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Skill
        </label>
        {loading ? (
          <div className="text-sm text-theme-text-secondary">Loading skills...</div>
        ) : (
          <select
            value={config?.skillType || ""}
            onChange={(e) => {
              const selectedSkill = availableSkills.find(s => s.id === e.target.value);
              onConfigChange({
                ...config,
                skillType: e.target.value,
                skillName: selectedSkill?.label || e.target.value,
              });
            }}
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
          >
            <option value="">Select a skill...</option>
            {availableSkills.map((skill) => (
              <option key={skill.id} value={skill.id} title={skill.description}>
                {skill.label}
              </option>
            ))}
          </select>
        )}
        {config?.skillType && (
          <p className="text-xs text-theme-text-secondary mt-1">
            {availableSkills.find(s => s.id === config.skillType)?.description}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Configuration
        </label>
        <textarea
          value={config?.parameters || ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              parameters: e.target.value,
            })
          }
          className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
          rows={3}
          placeholder="Enter skill configuration (JSON format)..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Result Variable
        </label>
        {renderVariableSelect(
          config.resultVariable,
          (value) => onConfigChange({ ...config, resultVariable: value }),
          "Select or create variable",
          true
        )}
      </div>
    </div>
  );
}