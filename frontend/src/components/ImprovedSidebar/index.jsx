import React, { useState, useRef, useEffect } from "react";
import {
  House,
  ChatCircle,
  Gear,
  Users,
  Brain,
  Search,
  Plus,
  CaretDown,
  CaretRight,
  Bookmark,
  Clock,
  Archive,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";

export default function ImprovedSidebar() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { logo } = useLogo();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState(
    new Set(["workspaces"])
  );

  // Navigation structure
  const navigation = [
    {
      id: "main",
      label: "Main",
      items: [
        { icon: House, label: "Home", path: "/", badge: null },
        { icon: ChatCircle, label: "Chat", path: "/workspace", badge: null },
      ],
    },
    {
      id: "workspaces",
      label: "Workspaces",
      collapsible: true,
      items: [
        {
          icon: ChatCircle,
          label: "General",
          path: "/workspace/general",
          badge: "3",
        },
        {
          icon: Brain,
          label: "AI Research",
          path: "/workspace/research",
          badge: null,
        },
        {
          icon: Bookmark,
          label: "Documentation",
          path: "/workspace/docs",
          badge: "1",
        },
      ],
      actions: [
        {
          icon: Plus,
          label: "New Workspace",
          action: () => console.log("New workspace"),
        },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      show: user?.role === "admin",
      items: [
        { icon: Users, label: "Users", path: "/settings/users", badge: null },
        { icon: Brain, label: "Agents", path: "/settings/agents", badge: null },
        { icon: Gear, label: "Settings", path: "/settings", badge: null },
      ],
    },
  ];

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-72">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <span className="font-semibold text-lg text-gray-900">Tredy</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
        {navigation.map((section) => {
          if (section.show === false) return null;

          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {section.label}
                </h3>
                {section.collapsible && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <CaretDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <CaretRight className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Section Items */}
              {(!section.collapsible || isExpanded) && (
                <div className="space-y-1">
                  {section.items?.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${active ? "text-blue-700" : "text-gray-500"}`}
                        />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {/* Section Actions */}
                  {section.actions?.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={action.action}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Recent Activity */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent Activity
          </h3>
          <div className="space-y-1">
            {[
              { icon: Clock, label: "Project Planning", time: "2m ago" },
              { icon: Archive, label: "Code Review", time: "1h ago" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || "user"}
            </p>
          </div>
          <button className="p-1 rounded hover:bg-gray-100">
            <Gear className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Header improvement
export function ImprovedMobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logo } = useLogo();

  return (
    <>
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <span className="font-semibold text-lg text-gray-900">Tredy</span>
        </Link>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <List className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full">
            <ImprovedSidebar />
          </div>
        </div>
      )}
    </>
  );
}
