"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const FolderIcon = ({ isExpanded, isClient }) => {
  if (!isClient) return <span>📁</span>;
  
  return (
    <svg 
      width="8" 
      height="8" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#898989" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`transition-transform duration-200 ease-in-out ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
    >
      <path d="M3 8L12 17L21 8" />
    </svg>
  );
};

const ITEM_STYLE = "h-[20.5px] leading-[20.5px] text-[11px] text-[#757575] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] w-full select-none";

export default function Nav1({ items }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const toggleFolder = useCallback((folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.has(folderPath) ? newSet.delete(folderPath) : newSet.add(folderPath);
      return newSet;
    });
  }, []);

  const createUrl = useCallback((fullPath) => {
    return '/' + fullPath
      .replace(/\.md$/, '')
      .split('/')
      .map(segment => segment.normalize("NFC").trim().replace(/\s+/g, "-").toLowerCase())
      .join('/');
  }, []);

  // Sort function: folders first, then files, both alphabetically
  const sortItems = useCallback((items) => {
    if (!items || !Array.isArray(items)) return [];
    
    const folders = items.filter(item => item.type === 'folder').sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    const files = items.filter(item => item.type === 'file').sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    return [...folders, ...files];
  }, []);

  const renderItem = useCallback((item, currentPath = "", depth = 0) => {
    const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const paddingLeft = 8 + depth * 16;
    
    if (item.type === 'folder') {
      const isExpanded = expandedFolders.has(fullPath);
      const sortedChildren = sortItems(item.children);
      
      return (
        <div key={fullPath}>
          <div
            className={`flex items-center cursor-pointer ${ITEM_STYLE}`}
            style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px' }}
            onClick={() => toggleFolder(fullPath)}
          >
            <span className="mr-2 flex items-center shrink-0 ml-0.5">
              <FolderIcon isExpanded={isExpanded} isClient={isClient} />
            </span>
            <span className="font-medium truncate" title={item.name}>
              {item.name}
            </span>
          </div>
          
          {isExpanded && sortedChildren?.map(child => 
            renderItem(child, fullPath, depth + 1)
          )}
        </div>
      );
    }

    // File rendering
    const fileName = item.name.replace(/\.md$/, '');
    const urlPath = createUrl(fullPath);
    
    return (
      <Link
        key={fullPath}
        href={urlPath}
        className={`block truncate cursor-default ${ITEM_STYLE}`}
        title={fileName}
        style={{
          paddingLeft: `${paddingLeft + 18}px`,
          paddingRight: '8px'
        }}
      >
        {fileName}
      </Link>
    );
  }, [expandedFolders, isClient, toggleFolder, createUrl, sortItems]);

  const sortedItems = sortItems(items);

  return (
    <div className="select-none">
      {sortedItems.map(item => renderItem(item))}
    </div>
  );
}