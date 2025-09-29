"use client";

import { useState, useEffect } from "react";

export default function Nav2() {
  const [headers, setHeaders] = useState([]);
  const [activeHeader, setActiveHeader] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setActiveHeader(hash);

    // Load headers from sessionStorage on mount
    const storedHeaders = sessionStorage.getItem('currentHeaders');
    if (storedHeaders) {
      try {
        setHeaders(JSON.parse(storedHeaders));
      } catch (e) {
        console.error('Failed to parse stored headers:', e);
      }
    }

    // Listen for header updates from Notes component
    const handleHeadersUpdate = (event) => {
      setHeaders(event.detail || []);
    };

    window.addEventListener('headersUpdated', handleHeadersUpdate);

    return () => {
      window.removeEventListener('headersUpdated', handleHeadersUpdate);
    };
  }, []);

  if (headers.length === 0) return null;

  const handleHeaderClick = (e, headerId) => {
    e.preventDefault();
    
    const element = document.getElementById(headerId.substring(1));
    if (!element) return;

    const scrollContainer = element.closest('.overflow-y-auto');
    
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: element.offsetTop,
        behavior: 'instant'
      });
    }
    
    window.history.pushState(null, '', `${window.location.pathname}${headerId}`);
    setActiveHeader(headerId);
  };

  const headersWithDepth = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    let depth = 0;
    
    for (let j = i - 1; j >= 0; j--) {
      if (headers[j].level < header.level) {
        depth = headersWithDepth[j].depth + 1;
        break;
      }
    }
    
    headersWithDepth.push({ ...header, depth });
  }

  return (
    <div>
      {headersWithDepth.map((header, index) => (
        <a
          key={header.id || index}
          href={header.id}
          onClick={(e) => handleHeaderClick(e, header.id)}
          className="relative text-[11px] leading-4 cursor-default hover:text-[#0f0f0f] hover:bg-[#f5f5f5] h-[20.5px] flex items-center text-[#757575]"
          style={{ paddingLeft: `${8 + header.depth * 15}px` }}
        >
          {Array.from({ length: header.depth }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[1px] bg-[#e5e5e5]"
              style={{ left: `${8 + i * 15}px` }}
            />
          ))}
          
          <span className="truncate block" title={header.text}>
            {header.text}
          </span>
        </a>
      ))}
    </div>
  );
}