import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import { Plus, CircleNotch, Trash } from "@phosphor-icons/react";
import { useEffect, useState, useRef } from "react";
import ThreadItem from "./ThreadItem";
import { useParams } from "react-router-dom";
export const THREAD_RENAME_EVENT = "renameThread";

export default function ThreadContainer({ workspace, isExpanded }) {
  const { threadSlug = null } = useParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ctrlPressed, setCtrlPressed] = useState(false);

  useEffect(() => {
    const chatHandler = (event) => {
      const { threadSlug, newName } = event.detail;
      setThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.slug === threadSlug) {
            return { ...thread, name: newName };
          }
          return thread;
        })
      );
    };

    window.addEventListener(THREAD_RENAME_EVENT, chatHandler);

    return () => {
      window.removeEventListener(THREAD_RENAME_EVENT, chatHandler);
    };
  }, []);

  useEffect(() => {
    async function fetchThreads() {
      if (!workspace.slug) return;
      const { threads } = await Workspace.threads.all(workspace.slug);
      setLoading(false);
      setThreads(threads);
    }
    fetchThreads();
  }, [workspace.slug]);

  // Enable toggling of bulk-deletion by holding meta-key (ctrl on win and cmd/fn on others)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (["Control", "Meta"].includes(event.key)) {
        setCtrlPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (["Control", "Meta"].includes(event.key)) {
        setCtrlPressed(false);
        setThreads((prev) =>
          prev.map((t) => {
            return { ...t, deleted: false };
          })
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const toggleForDeletion = (id) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return { ...t, deleted: !t.deleted };
      })
    );
  };

  const handleDeleteAll = async () => {
    const slugs = threads.filter((t) => t.deleted === true).map((t) => t.slug);
    await Workspace.threads.deleteBulk(workspace.slug, slugs);
    setThreads((prev) => prev.filter((t) => !t.deleted));

    if (slugs.includes(threadSlug)) {
      window.location.href = paths.workspace.chat(workspace.slug);
    }
  };

  function removeThread(threadId) {
    setThreads((prev) =>
      prev.map((_t) => {
        if (_t.id !== threadId) return _t;
        return { ..._t, deleted: true };
      })
    );

    setTimeout(() => {
      setThreads((prev) => prev.filter((t) => !t.deleted));
    }, 500);
  }

  const handleCreateThread = async () => {
    const { thread, error } = await Workspace.threads.new(workspace.slug);
    if (error) {
      showToast(`Could not create Tredy - ${error}`, "error");
      return;
    }
    window.location.replace(paths.workspace.thread(workspace.slug, thread.slug));
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-10 items-center justify-center">
        <CircleNotch className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  const activeThreadIdx = !!threads.find(
    (thread) => thread?.slug === threadSlug
  )
    ? threads.findIndex((thread) => thread?.slug === threadSlug) + 1
    : 0;

  return (
    <div className="flex flex-col transition-all duration-500">
      {/* Tredys Header with + button */}
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <span className="text-xs text-gray-600 font-semibold">
          Tredys ({threads.length})
        </span>
        <button
          onClick={handleCreateThread}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Create new Tredy"
        >
          <Plus size={14} className="text-gray-600" />
        </button>
      </div>

      {/* Tredy List */}
      <div className={`
        relative transition-all duration-500
        ${isExpanded ? "max-h-[400px]" : "max-h-[200px]"} 
        overflow-y-auto custom-scrollbar space-y-1
      `}>
        {threads.map((thread, i) => (
          <div
            key={thread.slug}
            className="transition-all duration-300"
            style={{
              animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`
            }}
          >
            <ThreadItem
              idx={i + 1}
              ctrlPressed={ctrlPressed}
              toggleMarkForDeletion={toggleForDeletion}
              activeIdx={activeThreadIdx}
              isActive={thread.slug === threadSlug}
              workspace={workspace}
              onRemove={removeThread}
              thread={thread}
              hasNext={i !== threads.length - 1}
            />
          </div>
        ))}
        
        {threads.length === 0 && (
          <div className="text-center py-4 text-xs text-gray-400">
            No Tredys yet. Click + to create one.
          </div>
        )}
      </div>

      {/* Delete All Button - only show when items are marked */}
      {ctrlPressed && threads.filter((t) => t.deleted).length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleDeleteAll}
            className="w-full px-3 py-2 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-all"
          >
            <Trash size={14} className="inline mr-1" />
            Delete {threads.filter((t) => t.deleted).length} Tredys
          </button>
        </div>
      )}
    </div>
  );
}