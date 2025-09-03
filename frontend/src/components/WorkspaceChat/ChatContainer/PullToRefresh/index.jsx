import React, { useState, useRef, useCallback } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80,
  refreshingHeight = 60 
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStart;
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      // Add resistance to pull
      const adjustedDistance = Math.min(distance * 0.5, 150);
      setPullDistance(adjustedDistance);
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(refreshingHeight);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setTouchStart(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh, refreshingHeight]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-theme-bg-secondary z-10 transition-all duration-300"
        style={{ 
          height: `${pullDistance}px`,
          opacity: Math.min(pullDistance / threshold, 1)
        }}
      >
        <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
          <ArrowClockwise 
            className="w-6 h-6 text-theme-text-secondary"
            weight="bold"
          />
        </div>
      </div>
      
      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}