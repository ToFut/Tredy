import React, { useState } from "react";
import {
  List,
  X,
  House,
  Gear,
  Users,
  ChatCircle,
  Brain,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { icon: House, label: "Home", path: "/" },
    { icon: ChatCircle, label: "Chat", path: "/workspace" },
    { icon: Brain, label: "Agents", path: "/settings/agents" },
    { icon: Users, label: "Users", path: "/settings/users" },
    { icon: Gear, label: "Settings", path: "/settings" },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white shadow-lg rounded-xl"
        aria-label="Open navigation"
      >
        <List className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Navigation Panel */}
          <div className="relative flex flex-col w-80 max-w-[85vw] bg-white h-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${active ? "text-blue-700" : "text-gray-500"}`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AI</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tredy</p>
                  <p className="text-xs text-gray-500">v2.0 Mobile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar (Alternative mobile navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
        <div className="flex items-center justify-around">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
