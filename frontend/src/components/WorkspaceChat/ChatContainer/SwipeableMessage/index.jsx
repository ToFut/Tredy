import React, { useState, useRef, useCallback } from "react";
import { Copy, ArrowClockwise, Heart, Trash } from "@phosphor-icons/react";

export default function SwipeableMessage({ 
  children, 
  onCopy,
  onRegenerate,
  onFavorite,
  onDelete,
  role = "assistant"
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;
    
    const touchX = e.touches[0].clientX;
    const distance = touchX - touchStart;
    
    // Only allow swipe left
    if (distance < 0) {
      const adjustedDistance = Math.max(distance * 0.5, -120);
      setSwipeX(adjustedDistance);
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (swipeX < -60) {
      // Show actions
      setSwipeX(-100);
      setShowActions(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    } else {
      // Reset
      setSwipeX(0);
      setShowActions(false);
    }
    setTouchStart(null);
  }, [swipeX]);

  const handleAction = useCallback((action) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    action();
    setSwipeX(0);
    setShowActions(false);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-4"
        style={{
          opacity: Math.abs(swipeX) / 100,
          pointerEvents: showActions ? 'auto' : 'none'
        }}
      >
        {onCopy && (
          <button
            onClick={() => handleAction(onCopy)}
            className="app-button p-2 rounded-full bg-blue-500 text-white"
          >
            <Copy className="w-5 h-5" />
          </button>
        )}
        {role === "assistant" && onRegenerate && (
          <button
            onClick={() => handleAction(onRegenerate)}
            className="app-button p-2 rounded-full bg-green-500 text-white"
          >
            <ArrowClockwise className="w-5 h-5" />
          </button>
        )}
        {onFavorite && (
          <button
            onClick={() => handleAction(onFavorite)}
            className="app-button p-2 rounded-full bg-pink-500 text-white"
          >
            <Heart className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => handleAction(onDelete)}
            className="app-button p-2 rounded-full bg-red-500 text-white"
          >
            <Trash className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Message content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}