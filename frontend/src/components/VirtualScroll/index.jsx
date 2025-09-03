import React, { useState, useEffect, useRef, useMemo } from 'react';

const DEFAULT_ITEM_HEIGHT = 100;
const OVERSCAN = 5;

export default function VirtualScroll({
  items = [],
  height,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  renderItem,
  className = "",
  onScroll,
  maintainScrollPosition = true
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef();
  const scrollTimeoutRef = useRef();

  const totalHeight = items.length * itemHeight;
  const containerHeight = height || 400;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, items.length]);

  // Handle scroll events
  const handleScroll = (e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    onScroll?.(e);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  // Scroll to bottom when new items are added
  useEffect(() => {
    if (maintainScrollPosition && scrollElementRef.current) {
      const element = scrollElementRef.current;
      const wasAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
      
      if (wasAtBottom) {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, [items.length, maintainScrollPosition]);

  // Render visible items
  const visibleItems = [];
  for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
    if (items[i]) {
      visibleItems.push(
        <div
          key={items[i].id || i}
          style={{
            position: 'absolute',
            top: i * itemHeight,
            width: '100%',
            height: itemHeight,
          }}
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
  }

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
      
      {/* Scroll indicator */}
      {isScrolling && items.length > 20 && (
        <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  );
}

// Enhanced version for chat messages with dynamic heights
export function VirtualChatHistory({
  messages = [],
  height,
  renderMessage,
  className = "",
  onScroll,
  autoScrollToBottom = true
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState(new Map());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollElementRef = useRef();
  const itemRefs = useRef(new Map());
  const observerRef = useRef();

  // Estimate or use cached heights
  const getItemHeight = (index) => {
    return itemHeights.get(index) || 100; // Default height
  };

  // Calculate positions of all items
  const itemPositions = useMemo(() => {
    const positions = [];
    let offset = 0;
    
    for (let i = 0; i < messages.length; i++) {
      positions.push({ index: i, offset, height: getItemHeight(i) });
      offset += getItemHeight(i);
    }
    
    return positions;
  }, [messages.length, itemHeights]);

  const totalHeight = itemPositions.length > 0 
    ? itemPositions[itemPositions.length - 1].offset + itemPositions[itemPositions.length - 1].height 
    : 0;

  // Find visible items
  const visibleRange = useMemo(() => {
    const containerHeight = height || 400;
    const start = itemPositions.findIndex(pos => pos.offset + pos.height > scrollTop);
    const end = itemPositions.findIndex(pos => pos.offset > scrollTop + containerHeight);
    
    return {
      startIndex: Math.max(0, start - OVERSCAN),
      endIndex: end === -1 ? itemPositions.length - 1 : Math.min(itemPositions.length - 1, end + OVERSCAN)
    };
  }, [scrollTop, itemPositions, height]);

  // Measure item heights using ResizeObserver
  useEffect(() => {
    observerRef.current = new ResizeObserver((entries) => {
      const newHeights = new Map(itemHeights);
      let changed = false;
      
      entries.forEach((entry) => {
        const index = parseInt(entry.target.dataset.index);
        const height = entry.contentRect.height;
        
        if (newHeights.get(index) !== height) {
          newHeights.set(index, height);
          changed = true;
        }
      });
      
      if (changed) {
        setItemHeights(newHeights);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [itemHeights]);

  // Handle scroll
  const handleScroll = (e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setIsUserScrolling(!isAtBottom);
    
    onScroll?.(e);
  };

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (autoScrollToBottom && !isUserScrolling && scrollElementRef.current) {
      const element = scrollElementRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length, autoScrollToBottom, isUserScrolling]);

  // Render visible items
  const visibleItems = [];
  for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
    const position = itemPositions[i];
    if (position && messages[i]) {
      visibleItems.push(
        <div
          key={messages[i].id || i}
          data-index={i}
          ref={(el) => {
            if (el) {
              itemRefs.current.set(i, el);
              observerRef.current?.observe(el);
            } else {
              const existing = itemRefs.current.get(i);
              if (existing) {
                observerRef.current?.unobserve(existing);
                itemRefs.current.delete(i);
              }
            }
          }}
          style={{
            position: 'absolute',
            top: position.offset,
            width: '100%',
            minHeight: position.height,
          }}
        >
          {renderMessage(messages[i], i)}
        </div>
      );
    }
  }

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-chat-history ${className}`}
      style={{
        height: height || 400,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
      
      {/* Scroll to bottom button */}
      {isUserScrolling && (
        <button
          onClick={() => {
            if (scrollElementRef.current) {
              scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
              setIsUserScrolling(false);
            }
          }}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5 5 5-5z"/>
          </svg>
        </button>
      )}
    </div>
  );
}