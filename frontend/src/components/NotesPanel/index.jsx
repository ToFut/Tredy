import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, FileText, Gear, FlowArrow, FloppyDisk } from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";

export default function NotesPanel({ workspace, isVisible }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const textareaRef = useRef(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    if (workspace?.slug) {
      const savedNotes = localStorage.getItem(`notes_${workspace.slug}`);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0 && !activeNote) {
          setActiveNote(parsedNotes[0]);
        }
      }
    }
  }, [workspace?.slug]);

  // Auto-save notes
  useEffect(() => {
    if (workspace?.slug && notes.length > 0) {
      localStorage.setItem(`notes_${workspace.slug}`, JSON.stringify(notes));
    }
  }, [notes, workspace?.slug]);

  // Listen for workflow creation events from chat
  useEffect(() => {
    const handleCreateWorkflow = (event) => {
      const { chatContext, timestamp } = event.detail;
      createWorkflowFromChat(chatContext, timestamp);
    };

    window.addEventListener('createWorkflowFromChat', handleCreateWorkflow);
    return () => {
      window.removeEventListener('createWorkflowFromChat', handleCreateWorkflow);
    };
  }, []);

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "New Note",
      content: "",
      timestamp: new Date().toISOString(),
      type: "note"
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setShowWorkflowBuilder(false);
  };

  const createNewWorkflow = () => {
    const newWorkflow = {
      id: Date.now(),
      title: "New Workflow",
      content: "",
      timestamp: new Date().toISOString(),
      type: "workflow",
      workflowData: {
        nodes: [],
        edges: [],
        triggers: []
      }
    };
    setNotes([newWorkflow, ...notes]);
    setActiveNote(newWorkflow);
    setShowWorkflowBuilder(true);
    setIsCreatingWorkflow(true);
  };

  const createWorkflowFromChat = (chatContext, timestamp) => {
    const newWorkflow = {
      id: Date.now(),
      title: `Workflow from Chat - ${new Date(timestamp).toLocaleTimeString()}`,
      content: `Auto-generated from conversation context:\n\n"${chatContext.substring(0, 200)}..."`,
      timestamp: timestamp,
      type: "workflow",
      workflowData: {
        nodes: [],
        edges: [],
        triggers: [],
        chatContext: chatContext
      }
    };
    setNotes([newWorkflow, ...notes]);
    setActiveNote(newWorkflow);
    setShowWorkflowBuilder(true);
    setIsCreatingWorkflow(true);
  };

  const updateActiveNote = (updates) => {
    if (!activeNote) return;
    
    const updatedNote = { ...activeNote, ...updates, timestamp: new Date().toISOString() };
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id ? updatedNote : note
    );
    
    setNotes(updatedNotes);
    setActiveNote(updatedNote);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Note ({notes.length})
          </h2>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Gear className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={createNewNote}
            className="flex-1 flex items-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Note
          </button>
          <button
            onClick={createNewWorkflow}
            className="flex-1 flex items-center gap-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <FlowArrow className="w-4 h-4" />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 flex flex-col min-h-0">
        {notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
            <FileText className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-center text-sm">
              Your files and notes are right by your side—no extra steps, just seamless interaction with your knowledge.
            </p>
          </div>
        ) : (
          <>
            {/* Notes Sidebar */}
            <div className="border-b border-gray-200/50">
              <div className="max-h-40 overflow-y-auto">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNote(note);
                      setShowWorkflowBuilder(note.type === 'workflow');
                    }}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeNote?.id === note.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-800 truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(note.timestamp)}
                        </p>
                        {note.type === 'workflow' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                            Workflow
                          </span>
                        )}
                      </div>
                      {note.type === 'workflow' && (
                        <FlowArrow className="w-4 h-4 text-purple-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    {note.content && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {note.content.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Note Editor */}
            {activeNote && (
              <div className="flex-1 flex flex-col min-h-0">
                {showWorkflowBuilder && activeNote.type === 'workflow' ? (
                  <WorkflowBuilder 
                    note={activeNote}
                    onUpdate={updateActiveNote}
                    isCreating={isCreatingWorkflow}
                    workspace={workspace}
                  />
                ) : (
                  <NoteEditor 
                    note={activeNote}
                    onUpdate={updateActiveNote}
                    textareaRef={textareaRef}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Bar */}
      {activeNote && (
        <div className="p-2 border-t border-gray-200/50 bg-gray-50/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {activeNote.type === 'workflow' ? 'Workflow' : 'Note'} • {formatTimestamp(activeNote.timestamp)}
            </span>
            <div className="flex items-center gap-1">
              <FloppyDisk className="w-3 h-3" />
              <span>Auto-saved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Note Editor Component
function NoteEditor({ note, onUpdate, textareaRef }) {
  const handleTitleChange = (e) => {
    onUpdate({ title: e.target.value });
  };

  const handleContentChange = (e) => {
    onUpdate({ content: e.target.value });
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <input
        type="text"
        value={note.title}
        onChange={handleTitleChange}
        className="text-lg font-semibold bg-transparent border-none outline-none text-gray-800 mb-3 placeholder-gray-400"
        placeholder="Note title..."
      />
      <textarea
        ref={textareaRef}
        value={note.content}
        onChange={handleContentChange}
        className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400 leading-relaxed"
        placeholder="Start writing your notes here..."
      />
    </div>
  );
}

