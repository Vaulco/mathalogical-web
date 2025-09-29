"use client";

import { useState, useEffect, useRef } from "react";

export default function Notes({ content, filename, displayName }) {
  const [title, setTitle] = useState("Loading...");
  const [processedContent, setProcessedContent] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!content) return;

    try {
      const processor = new MarkdownProcessor(displayName || filename);
      const processed = processor.processMarkdown(content);
      const pageTitle = processor.getTitle();
      const extractedHeaders = processor.getHeaders();

      setTitle(pageTitle);
      setProcessedContent(processed);
      
      // Store headers and dispatch event
      sessionStorage.setItem('currentHeaders', JSON.stringify(extractedHeaders));
      const event = new CustomEvent('headersUpdated', { 
        detail: extractedHeaders 
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error(err);
      setProcessedContent([{ type: "text", html: "Error loading content." }]);
      setTitle("Error");
      
      // Clear headers on error
      sessionStorage.removeItem('currentHeaders');
      const event = new CustomEvent('headersUpdated', { detail: [] });
      window.dispatchEvent(event);
    }
  }, [content, filename, displayName]);

  // Handle URL fragment navigation on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && contentRef.current) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 100);
    }
  }, [processedContent]);

  // Clear headers when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('currentHeaders');
      const event = new CustomEvent('headersUpdated', { detail: [] });
      window.dispatchEvent(event);
    };
  }, []);

  return (
    <div className="flex-1 p-[25px] overflow-y-auto h-full w-[585px] max-w-full min-w-0" ref={contentRef}>
      <div className="font-semibold text-[15px] mb-3 break-words">{title}</div>
      <div id="content" className="break-words">
        {processedContent.map((item, i) => (
          <div
            key={i}
            id={item.headerId || undefined}
            className={`m-0 min-h-[12px] leading-[1.5] break-words ${
              item.type === "header" ? `h${item.level}` : ""
            } ${item.noPadding ? "no-padding-top" : ""}`}
            dangerouslySetInnerHTML={{ __html: item.html }}
          />
        ))}
      </div>
    </div>
  );
}

class MarkdownProcessor {
  constructor(nameOrFile = "untitled") {
    this.nameOrFile = nameOrFile;
    this.headerRegex = /^(#{1,6}) (.*)$/;
    this.formatPatterns = [
      { regex: /\*\*\*(.*?)\*\*\*/g, tag: "strong><em", close: "em></strong" },
      { regex: /\*\*(.*?)\*\*/g, tag: "strong", close: "strong" },
      { regex: /\*(.*?)\*/g, tag: "em", close: "em" },
    ];
    this.headers = [];
    this.headerCounts = new Map();
  }

  getTitle() {
    return this.nameOrFile
      .replace(/\.md$/, "")
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getHeaders() {
    return this.headers;
  }

  createHeaderId(text, level) {
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const levelPrefix = '#'.repeat(level);
    const baseFragment = `${levelPrefix}${cleanText}`;
    
    const key = `${level}-${cleanText}`;
    const count = this.headerCounts.get(key) || 0;
    this.headerCounts.set(key, count + 1);
    
    const fragment = count > 0 ? `${baseFragment}-${count}` : baseFragment;
    
    return fragment;
  }

  processMarkdown(markdown) {
    const lines = this.cleanLines(markdown.split("\n"));
    this.headers = [];
    this.headerCounts.clear();
    
    return this.processLines(lines);
  }

  cleanLines(lines) {
    const start = lines.findIndex(line => line.trim());
    if (start === -1) return [];

    const result = [];
    let wasEmpty = false;

    for (let i = start; i < lines.length; i++) {
      const isEmpty = !lines[i].trim();
      if (!isEmpty || !wasEmpty) {
        result.push(lines[i]);
      }
      wasEmpty = isEmpty;
    }
    return result;
  }

  processLines(lines) {
    return lines.map((line, index) => {
      const headerMatch = line.match(this.headerRegex);

      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const headerId = this.createHeaderId(text, level);
        
        this.headers.push({
          level,
          text,
          id: headerId
        });

        return {
          type: "header",
          level,
          html: this.applyFormatting(text),
          headerId: headerId.substring(1),
          noPadding: index === 0 || !lines[index - 1].trim(),
        };
      }

      if (!line.trim()) {
        return { type: "empty", html: "\u00A0" };
      }

      return {
        type: "text",
        html: this.applyFormatting(line),
      };
    });
  }

  applyFormatting(text) {
    return this.formatPatterns.reduce(
      (result, pattern) => result.replace(
        pattern.regex,
        `<${pattern.tag}>$1</${pattern.close}>`
      ),
      text
    );
  }
}