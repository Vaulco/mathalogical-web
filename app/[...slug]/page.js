import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import Notes from "../components/note";

function hasMarkdownFiles(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively check subdirectories
        if (hasMarkdownFiles(fullPath)) {
          return true;
        }
      } else if (entry.name.endsWith('.md')) {
        return true;
      }
    }
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error);
  }
  
  return false;
}

function getAllFilesInDirectory(dirPath, relativePath = "") {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeItemPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Only process directory if it contains markdown files
        if (hasMarkdownFiles(fullPath)) {
          files.push(...getAllFilesInDirectory(fullPath, relativeItemPath));
        }
      } else if (entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, "");
        files.push({
          fullPath,
          relativePath: relativeItemPath,
          fileName: entry.name,
          nameWithoutExt,
          urlSegments: relativeItemPath
            .replace(/\.md$/, '')
            .split(path.sep)
            .map(segment => segment.replace(/\s+/g, "-").toLowerCase())
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

function findBestFileMatch(notesPath, slugArray) {
  const allFiles = getAllFilesInDirectory(notesPath);
  const slugArrayLower = slugArray.map(s => s.toLowerCase());
  const slugStringified = JSON.stringify(slugArrayLower);
  
  return allFiles.find(file =>
    // Exact URL segment match
    JSON.stringify(file.urlSegments) === slugStringified ||
    // Single file in root
    (slugArray.length === 1 &&
      file.urlSegments.length === 1 &&
      file.nameWithoutExt.replace(/\s+/g, "-").toLowerCase() === slugArrayLower[0]) ||
    // File path segments match
    JSON.stringify(file.relativePath
      .replace(/\.md$/, '')
      .split(path.sep)
      .map(segment => segment.replace(/\s+/g, "-").toLowerCase())
    ) === slugStringified ||
    // Filename match for nested files
    (slugArray.length > 1 &&
      file.nameWithoutExt.replace(/\s+/g, "-").toLowerCase() === slugArrayLower[slugArrayLower.length - 1])
  ) || null;
}

export default async function CatchAllPage({ params }) {
  const { slug = [] } = await params;
  const notesPath = path.join(process.cwd(), "public", "notes");
  
  // Redirect if notes directory doesn't exist
  if (!fs.existsSync(notesPath)) {
    redirect("/");
  }
  
  // Find matching file - redirect if not found
  const fileInfo = findBestFileMatch(notesPath, slug);
  if (!fileInfo) {
    redirect("/");
  }
  
  // Read file content - redirect if error reading
  try {
    const content = fs.readFileSync(fileInfo.fullPath, "utf8");
    return (
      <Notes
        content={content}
        filename={fileInfo.fileName}
        displayName={fileInfo.nameWithoutExt}
      />
    );
  } catch (err) {
    console.error("Error reading file:", fileInfo.fullPath, err);
    redirect("/");
  }
}