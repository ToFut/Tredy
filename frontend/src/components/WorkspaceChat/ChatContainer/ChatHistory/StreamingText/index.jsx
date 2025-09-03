import React, { useState, useEffect, useRef } from "react";

export default function StreamingText({ 
  text = "", 
  speed = 30,
  onComplete = () => {},
  showCursor = true 
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) return;
    
    // Reset when text changes
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className="relative">
      {displayedText}
      {showCursor && !isComplete && (
        <span className="inline-block w-0.5 h-5 bg-theme-text-primary animate-pulse ml-0.5" />
      )}
    </span>
  );
}

export function TypewriterEffect({ children, delay = 0 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}

// Add this CSS to your styles
const typewriterStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;