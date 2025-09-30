import React, { useState, useEffect, useRef } from "react";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Workspace from "@/models/workspace";
import ManageWorkspace, {
  useManageWorkspaceModal,
} from "../../Modals/ManageWorkspace";
import paths from "@/utils/paths";
import { useParams, useNavigate } from "react-router-dom";
import {
  GearSix,
  UploadSimple,
  DotsSixVertical,
  CaretRight,
  Sparkle,
} from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import ThreadContainer from "./ThreadContainer";
import { useMatch } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import showToast from "@/utils/toast";
import SummaryTooltip from "@/components/SummaryTooltip";

export default function ActiveWorkspaces() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set());
  const [hoveredWorkspace, setHoveredWorkspace] = useState(null);
  const [tooltipWorkspace, setTooltipWorkspace] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const { showing, showModal, hideModal } = useManageWorkspaceModal();
  const { user } = useUser();
  const isInWorkspaceSettings = !!useMatch("/workspace/:slug/settings/:tab");
  const hoverTimeoutRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  useEffect(() => {
    async function getWorkspaces() {
      const workspaces = await Workspace.all();
      setLoading(false);
      setWorkspaces(Workspace.orderWorkspaces(workspaces));
    }
    getWorkspaces();
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the workspace item and the tooltip
      if (
        tooltipWorkspace &&
        !event.target.closest(".workspace-item") &&
        !event.target.closest(".summary-tooltip")
      ) {
        setTooltipWorkspace(null);
        setTooltipAnchor(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [tooltipWorkspace]);

  // Auto-expand active workspace
  useEffect(() => {
    if (slug) {
      setExpandedWorkspaces((prev) => new Set(prev).add(slug));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-2 px-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton.default
            key={i}
            height={56}
            width="100%"
            baseColor="rgba(255,255,255,0.1)"
            highlightColor="rgba(255,255,255,0.2)"
            className="rounded-xl"
          />
        ))}
      </div>
    );
  }

  function reorderWorkspaces(startIndex, endIndex) {
    const reorderedWorkspaces = Array.from(workspaces);
    const [removed] = reorderedWorkspaces.splice(startIndex, 1);
    reorderedWorkspaces.splice(endIndex, 0, removed);
    setWorkspaces(reorderedWorkspaces);
    const success = Workspace.storeWorkspaceOrder(
      reorderedWorkspaces.map((w) => w.id)
    );
    if (!success) {
      showToast("Failed to reorder workspaces", "error");
      Workspace.all().then((workspaces) => setWorkspaces(workspaces));
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return;
    reorderWorkspaces(result.source.index, result.destination.index);
  };

  const toggleWorkspace = (workspaceSlug) => {
    setExpandedWorkspaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceSlug)) {
        newSet.delete(workspaceSlug);
      } else {
        newSet.add(workspaceSlug);
      }
      return newSet;
    });
  };

  const handleWorkspaceClick = (workspace, event) => {
    // Toggle tooltip on click
    if (tooltipWorkspace?.slug === workspace.slug) {
      setTooltipWorkspace(null);
      setTooltipAnchor(null);
    } else {
      setTooltipWorkspace(workspace);
      setTooltipAnchor(event.currentTarget);
    }
  };

  const handleWorkspaceHover = (workspace) => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredWorkspace(workspace.slug);
    }, 300);
  };

  const handleWorkspaceLeave = (workspaceSlug) => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredWorkspace(null);
    }, 500);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="workspaces">
        {(provided) => (
          <div
            role="list"
            aria-label="Workspaces"
            className="flex flex-col gap-y-2 px-2 overflow-y-auto custom-scrollbar max-h-[calc(100vh-280px)]"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {workspaces.map((workspace, index) => {
              const isActive = workspace.slug === slug;
              const isExpanded = expandedWorkspaces.has(workspace.slug);
              const isHovered = hoveredWorkspace === workspace.slug;

              return (
                <Draggable
                  key={workspace.id}
                  draggableId={workspace.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`workspace-item transition-all duration-300 ${
                        snapshot.isDragging ? "opacity-50" : ""
                      }`}
                      onClick={(e) => handleWorkspaceClick(workspace, e)}
                      onMouseEnter={() => handleWorkspaceHover(workspace)}
                      onMouseLeave={() => handleWorkspaceLeave(workspace.slug)}
                      style={{
                        animation: `fadeInSlide 0.4s ease-out ${index * 0.05}s both`,
                      }}
                    >
                      {/* Glow effect for active workspace */}
                      {isActive && (
                        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 blur-2xl animate-pulse" />
                      )}

                      {/* Workspace Header */}
                      <div
                        className={`
                        relative transition-all duration-300
                        ${isActive || isHovered ? "scale-[1.02]" : "scale-100"}
                      `}
                      >
                        <div
                          onClick={(e) => {
                            // Only navigate if not clicking on action buttons
                            if (!e.target.closest(".action-button")) {
                              if (isActive) {
                                e.preventDefault();
                                toggleWorkspace(workspace.slug);
                              } else {
                                navigate(paths.workspace.chat(workspace.slug));
                              }
                            }
                          }}
                          className={`
                            w-full transition-all duration-300 flex items-center gap-x-2 py-2 px-2.5 rounded-lg cursor-pointer
                            backdrop-blur-xl border
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-50/90 to-purple-50/90 border-blue-200 shadow-md"
                                : isHovered
                                  ? "bg-white/70 border-gray-200 shadow-sm"
                                  : "bg-white/50 border-gray-100 hover:border-gray-200"
                            }
                          `}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab opacity-0 hover:opacity-100 group-hover:opacity-50 transition-opacity"
                          >
                            <DotsSixVertical
                              size={16}
                              className={
                                isActive ? "text-blue-400" : "text-gray-400"
                              }
                              weight="bold"
                            />
                          </div>

                          {/* Expand Chevron */}
                          <CaretRight
                            size={14}
                            className={`
                              transition-all duration-300
                              ${isActive ? "text-blue-500" : "text-gray-400"}
                              ${isExpanded ? "rotate-90" : "rotate-0"}
                            `}
                          />

                          {/* Workspace Icon */}
                          <div
                            className={`
                            relative w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300
                            ${
                              isActive
                                ? "bg-gradient-to-br from-blue-400 to-purple-400 shadow-sm"
                                : "bg-gradient-to-br from-gray-200 to-gray-300"
                            }
                          `}
                          >
                            {isActive && (
                              <Sparkle
                                className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse"
                                weight="fill"
                              />
                            )}
                            <svg
                              className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-600"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>

                          {/* Workspace Info */}
                          <div className="flex-1 overflow-hidden text-left">
                            <p
                              className={`text-sm font-medium truncate transition-colors ${
                                isActive ? "text-blue-700" : "text-gray-700"
                              }`}
                            >
                              {workspace.name}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          {user?.role !== "default" && (
                            <div
                              className={`
                              flex items-center gap-x-1 transition-all duration-300
                              ${isActive || isHovered ? "opacity-100" : "opacity-0"}
                            `}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedWs(workspace);
                                  showModal();
                                }}
                                className={`
                                  action-button p-1.5 rounded-lg transition-all duration-200
                                  ${
                                    isActive
                                      ? "hover:bg-blue-100 text-blue-600 hover:scale-110"
                                      : "hover:bg-gray-100 text-gray-500 hover:scale-110"
                                  }
                                `}
                              >
                                <UploadSimple className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate(
                                    isInWorkspaceSettings
                                      ? paths.workspace.chat(workspace.slug)
                                      : paths.workspace.settings.generalAppearance(
                                          workspace.slug
                                        )
                                  );
                                }}
                                className={`
                                  action-button p-1.5 rounded-lg transition-all duration-200
                                  ${
                                    isActive
                                      ? "hover:bg-blue-100 text-blue-600 hover:scale-110"
                                      : "hover:bg-gray-100 text-gray-500 hover:scale-110"
                                  }
                                `}
                              >
                                <GearSix
                                  className={`h-4 w-4 ${
                                    isInWorkspaceSettings &&
                                    workspace.slug === slug
                                      ? "text-blue-500"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Threads Container with Animation */}
                      <div
                        className={`
                        overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${
                          isExpanded
                            ? "max-h-[400px] opacity-100 mt-2"
                            : "max-h-0 opacity-0"
                        }
                      `}
                      >
                        <div className="pl-6">
                          <ThreadContainer
                            workspace={workspace}
                            isActive={isActive}
                            isExpanded={isExpanded}
                            isHovered={isHovered}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            {showing && (
              <ManageWorkspace
                hideModal={hideModal}
                providedSlug={selectedWs ? selectedWs.slug : null}
              />
            )}
          </div>
        )}
      </Droppable>
      {/* Summary Tooltip */}
      {tooltipWorkspace && (
        <SummaryTooltip
          workspace={tooltipWorkspace}
          threadSlug={null}
          anchor={tooltipAnchor}
          isVisible={!!tooltipWorkspace}
          onClose={() => {
            setTooltipWorkspace(null);
            setTooltipAnchor(null);
          }}
        />
      )}
    </DragDropContext>
  );
}
