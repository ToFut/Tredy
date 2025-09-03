import React, { useState, useEffect } from 'react';
import { CaretRight, Copy, ArrowsOut, Sparkle } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function StructuredResponse({ content, workspaceSlug }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedSection, setCopiedSection] = useState(null);

  // Parse content into structured sections
  const parseContent = (text) => {
    if (typeof text !== 'string') return { sections: [] };
    
    // Check if content has markdown headers
    const hasHeaders = text.includes('## ') || text.includes('### ');
    if (!hasHeaders) {
      return {
        sections: [{
          id: 'main',
          title: 'Response',
          type: 'general',
          content: text,
          icon: '💬'
        }]
      };
    }

    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        const title = line.replace('## ', '').trim();
        currentSection = {
          id: `section-${sections.length}`,
          title,
          type: detectSectionType(title),
          icon: getSectionIcon(title),
          content: ''
        };
        currentContent = [];
      } else if (line.startsWith('### ') && currentSection) {
        currentContent.push(line);
      } else {
        currentContent.push(line);
      }
    });

    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return { sections };
  };

  const detectSectionType = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary')) return 'overview';
    if (lower.includes('code') || lower.includes('implementation')) return 'code';
    if (lower.includes('analysis') || lower.includes('data')) return 'analysis';
    if (lower.includes('step') || lower.includes('instruction')) return 'steps';
    if (lower.includes('example')) return 'example';
    if (lower.includes('conclusion') || lower.includes('recommendation')) return 'conclusion';
    return 'general';
  };

  const getSectionIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary')) return '📋';
    if (lower.includes('code') || lower.includes('implementation')) return '💻';
    if (lower.includes('analysis') || lower.includes('data')) return '📊';
    if (lower.includes('step') || lower.includes('instruction')) return '📝';
    if (lower.includes('example')) return '💡';
    if (lower.includes('warning') || lower.includes('important')) return '⚠️';
    if (lower.includes('tip') || lower.includes('note')) return '💡';
    if (lower.includes('conclusion')) return '🎯';
    return '📄';
  };

  const getContentIndicatorClass = (type) => {
    switch (type) {
      case 'code': return 'content-indicator code';
      case 'analysis': return 'content-indicator analysis';
      case 'overview': return 'content-indicator research';
      default: return 'content-indicator creative';
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copySection = async (sectionId, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const { sections } = parseContent(content);

  // Auto-expand first section or all if only one
  useEffect(() => {
    if (sections.length === 1) {
      setExpandedSections({ [sections[0].id]: true });
    } else if (sections.length > 1) {
      setExpandedSections({ [sections[0].id]: true });
    }
  }, [content]);

  // If no structured content, return simple markdown
  if (sections.length === 1 && sections[0].type === 'general' && !content.includes('##')) {
    return (
      <div className="text-theme-text-primary">
        <ReactMarkdown
          children={content}
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-theme-bg-chat px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="structured-response">
      {/* Table of Contents for multiple sections */}
      {sections.length > 3 && (
        <nav className="toc">
          <div className="text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wider">
            Contents
          </div>
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  toggleSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="toc-item"
              >
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="collapsible-section"
          >
            {/* Section Header */}
            <div
              onClick={() => toggleSection(section.id)}
              className={`collapsible-header ${expandedSections[section.id] ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className="text-base font-semibold text-theme-text-primary">
                  {section.title}
                </h3>
                <span className={getContentIndicatorClass(section.type)}>
                  {section.type}
                </span>
              </div>
              <CaretRight 
                className={`collapsible-icon w-5 h-5 text-theme-text-secondary`}
                weight="bold"
              />
            </div>

            {/* Section Content */}
            <div className={`collapsible-content ${expandedSections[section.id] ? 'expanded' : ''}`}>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  children={section.content}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      
                      return !inline && match ? (
                        <div className="relative group">
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '8px',
                              background: 'var(--theme-bg-chat)'
                            }}
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copySection(`${section.id}-code`, codeString);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity interactive-button p-2"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <code className="bg-theme-bg-chat px-1.5 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    h3: ({children}) => (
                      <h3 className="text-theme-text-primary font-medium mt-4 mb-2">{children}</h3>
                    ),
                    ul: ({children}) => (
                      <ul className="list-disc pl-5 space-y-1">{children}</ul>
                    ),
                    ol: ({children}) => (
                      <ol className="list-decimal pl-5 space-y-1">{children}</ol>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-theme-button-cta pl-4 italic">
                        {children}
                      </blockquote>
                    )
                  }}
                />
              </div>

              {/* Section Actions */}
              <div className="section-actions flex gap-2 mt-4 pt-3 border-t border-theme-sidebar-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copySection(section.id, section.content);
                  }}
                  className="interactive-button flex items-center gap-1.5"
                >
                  <Copy className="w-3 h-3" />
                  {copiedSection === section.id ? 'Copied!' : 'Copy'}
                </button>
                <button className="interactive-button flex items-center gap-1.5">
                  <ArrowsOut className="w-3 h-3" />
                  Expand
                </button>
                <button className="interactive-button flex items-center gap-1.5">
                  <Sparkle className="w-3 h-3" />
                  Explore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}