import React, { useState } from "react";
import {
  Plus,
  Lightning,
  ChartBar,
  Gear,
  FileText,
  Database,
  Globe,
  Envelope,
  Calendar,
  Code,
  Image,
  Video,
  MusicNote,
  Document,
  Folder,
  CheckCircle,
  ArrowRight,
  Sparkle,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";

const WORKFLOW_TEMPLATES = [
  {
    id: "data-processor",
    name: "Data Processor",
    description: "Automatically process and analyze data files",
    icon: <Database size={24} className="text-blue-500" />,
    category: "Data",
    difficulty: "Beginner",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "filePath", description: "Path to the data file" },
          ],
        },
      },
      { type: "file-reader", config: { filePath: "{{filePath}}" } },
      { type: "data-analyzer", config: { analysisType: "summary" } },
      { type: "report-generator", config: { format: "json" } },
    ],
    tags: ["data", "analysis", "automation"],
  },
  {
    id: "email-automation",
    name: "Email Automation",
    description: "Send automated emails based on triggers",
    icon: <Envelope size={24} className="text-green-500" />,
    category: "Communication",
    difficulty: "Intermediate",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "recipient", description: "Email recipient" },
            { name: "subject", description: "Email subject" },
          ],
        },
      },
      {
        type: "email-sender",
        config: { to: "{{recipient}}", subject: "{{subject}}" },
      },
      { type: "notification", config: { message: "Email sent successfully" } },
    ],
    tags: ["email", "communication", "automation"],
  },
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "Extract data from websites automatically",
    icon: <Globe size={24} className="text-purple-500" />,
    category: "Web",
    difficulty: "Intermediate",
    steps: [
      {
        type: "start",
        config: {
          variables: [{ name: "url", description: "Website URL to scrape" }],
        },
      },
      {
        type: "web-scraper",
        config: { url: "{{url}}", selectors: ["h1", "p", "a"] },
      },
      { type: "data-formatter", config: { outputFormat: "json" } },
      { type: "file-writer", config: { filename: "scraped-data.json" } },
    ],
    tags: ["web", "scraping", "data"],
  },
  {
    id: "file-organizer",
    name: "File Organizer",
    description: "Automatically organize files by type and date",
    icon: <Folder size={24} className="text-orange-500" />,
    category: "Files",
    difficulty: "Beginner",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "sourcePath", description: "Source directory path" },
          ],
        },
      },
      { type: "file-scanner", config: { path: "{{sourcePath}}" } },
      { type: "file-organizer", config: { organizeBy: "type" } },
      { type: "folder-creator", config: { createFolders: true } },
    ],
    tags: ["files", "organization", "automation"],
  },
  {
    id: "content-generator",
    name: "Content Generator",
    description: "Generate content using AI based on prompts",
    icon: <FileText size={24} className="text-indigo-500" />,
    category: "AI",
    difficulty: "Advanced",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "prompt", description: "Content generation prompt" },
            { name: "length", description: "Content length" },
          ],
        },
      },
      {
        type: "ai-generator",
        config: { model: "gpt-4", prompt: "{{prompt}}" },
      },
      { type: "content-formatter", config: { format: "markdown" } },
      { type: "file-writer", config: { filename: "generated-content.md" } },
    ],
    tags: ["ai", "content", "generation"],
  },
  {
    id: "calendar-sync",
    name: "Calendar Sync",
    description: "Sync events between different calendar systems",
    icon: <Calendar size={24} className="text-red-500" />,
    category: "Productivity",
    difficulty: "Advanced",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "sourceCalendar", description: "Source calendar ID" },
            { name: "targetCalendar", description: "Target calendar ID" },
          ],
        },
      },
      { type: "calendar-reader", config: { calendarId: "{{sourceCalendar}}" } },
      { type: "data-transformer", config: { mapping: "calendar-to-calendar" } },
      { type: "calendar-writer", config: { calendarId: "{{targetCalendar}}" } },
    ],
    tags: ["calendar", "sync", "productivity"],
  },
  {
    id: "image-processor",
    name: "Image Processor",
    description: "Process and enhance images automatically",
    icon: <Image size={24} className="text-pink-500" />,
    category: "Media",
    difficulty: "Intermediate",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "imagePath", description: "Path to image file" },
            { name: "operations", description: "Processing operations" },
          ],
        },
      },
      { type: "image-reader", config: { path: "{{imagePath}}" } },
      { type: "image-processor", config: { operations: "{{operations}}" } },
      { type: "image-writer", config: { outputPath: "processed-image.jpg" } },
    ],
    tags: ["image", "processing", "media"],
  },
  {
    id: "code-analyzer",
    name: "Code Analyzer",
    description: "Analyze code quality and generate reports",
    icon: <Code size={24} className="text-cyan-500" />,
    category: "Development",
    difficulty: "Advanced",
    steps: [
      {
        type: "start",
        config: {
          variables: [
            { name: "codePath", description: "Path to code directory" },
          ],
        },
      },
      {
        type: "code-scanner",
        config: {
          path: "{{codePath}}",
          languages: ["javascript", "python", "java"],
        },
      },
      {
        type: "quality-analyzer",
        config: { metrics: ["complexity", "duplication", "coverage"] },
      },
      { type: "report-generator", config: { format: "html" } },
    ],
    tags: ["code", "analysis", "quality"],
  },
];

const CATEGORY_COLORS = {
  Data: "bg-blue-100 text-blue-800",
  Communication: "bg-green-100 text-green-800",
  Web: "bg-purple-100 text-purple-800",
  Files: "bg-orange-100 text-orange-800",
  AI: "bg-indigo-100 text-indigo-800",
  Productivity: "bg-red-100 text-red-800",
  Media: "bg-pink-100 text-pink-800",
  Development: "bg-cyan-100 text-cyan-800",
};

const DIFFICULTY_COLORS = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

export default function WorkflowTemplates({ onClose, onTemplateSelect }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    "all",
    ...new Set(WORKFLOW_TEMPLATES.map((t) => t.category)),
  ];
  const difficulties = ["all", "Beginner", "Intermediate", "Advanced"];

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" ||
      template.difficulty === selectedDifficulty;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleCreateFromTemplate = async (template) => {
    setIsCreating(true);
    try {
      const workflowConfig = {
        name: `${template.name} Workflow`,
        description: template.description,
        active: false,
        steps: template.steps,
        tags: template.tags,
        category: template.category,
        difficulty: template.difficulty,
        createdFromTemplate: template.id,
      };

      const { success, error } = await AgentFlows.saveFlow(
        workflowConfig.name,
        workflowConfig
      );
      if (success) {
        showToast(
          `"${template.name}" workflow created successfully!`,
          "success"
        );
        onTemplateSelect && onTemplateSelect(workflowConfig);
        onClose();
      } else {
        showToast(`Failed to create workflow: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error creating workflow from template:", error);
      showToast("Error creating workflow from template", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkle size={28} className="text-purple-500" />
                Workflow Templates
              </h2>
              <p className="text-gray-600 mt-1">
                Choose from pre-built templates to get started quickly
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Difficulty:
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "all" ? "All Levels" : difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MagnifyingGlass size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  {/* Template Icon */}
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                    {template.icon}
                  </div>

                  {/* Template Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category]}`}
                    >
                      {template.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[template.difficulty]}`}
                    >
                      {template.difficulty}
                    </span>
                  </div>

                  {/* Steps Preview */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Steps:</div>
                    <div className="flex items-center justify-center gap-1">
                      {template.steps.slice(0, 4).map((step, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center"
                        >
                          <span className="text-xs font-medium text-purple-600">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                      {template.steps.length > 4 && (
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            +{template.steps.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Create Button */}
                  <button
                    disabled={isCreating}
                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Workflow
                      </>
                    )}
                  </button>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? "s" : ""} found
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lightning size={16} className="text-yellow-500" />
              Templates are customizable after creation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
