import "./globals.css";
import localFont from "next/font/local";
import fs from "fs";
import path from "path";
import Nav1 from "./components/nav1";
import Nav2 from "./components/nav2";

const cmunrm = localFont({
  src: "../public/cmunrm.ttf",
  variable: "--font-cmunrm",
});

export const metadata = {
  title: "Mathalogical",
};

function hasMarkdownFiles(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
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

function readDirectoryStructure(dirPath, relativePath = "") {
  const items = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeItemPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Only include folder if it contains markdown files
        if (hasMarkdownFiles(fullPath)) {
          items.push({
            name: entry.name,
            type: 'folder',
            path: relativeItemPath,
            children: readDirectoryStructure(fullPath, relativeItemPath)
          });
        }
      } else if (entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, "");
        items.push({
          name: nameWithoutExt,
          type: 'file',
          path: relativeItemPath,
          slug: nameWithoutExt.replace(/\s+/g, "-").toLowerCase(),
          filename: entry.name
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items;
}

const LeftSidebar = ({ directoryStructure }) => (
  <div className="w-[200px] flex flex-col border-gray-200 h-full hidden sm:flex">
    <nav className="flex-1 px-[9px] py-[25px] overflow-y-auto">
      <Nav1 items={directoryStructure} />
    </nav>
    {/* Bottom half - shows when right sidebar would be hidden */}
    <nav className="flex-1 px-[9px] py-[25px] overflow-y-auto lg:hidden border-t border-gray-200">
      <Nav2 />
    </nav>
  </div>
);

const RightSidebar = () => (
  <div className="w-[200px] flex flex-col border-gray-200 h-full hidden lg:flex">
    <nav className="flex-1 px-[9px] py-[25px] overflow-y-auto">
      <Nav2 />
    </nav>
  </div>
);

export default function RootLayout({ children }) {
  const notesPath = path.join(process.cwd(), "public", "notes");
  const directoryStructure = readDirectoryStructure(notesPath);

  return (
    <html lang="en" className={cmunrm.variable}>
      <body className="text-[13.5px] leading-6 font-[CMU,ui-sans-serif,system-ui,sans-serif] m-0 h-screen overflow-hidden text-[#0f0f0f]">
        <div className="flex h-full justify-center">
          <div className="flex mx-auto h-full min-w-0 w-full max-w-fit">
            <LeftSidebar directoryStructure={directoryStructure} />
            {children}
            <RightSidebar />
          </div>
        </div>
      </body>
    </html>
  );
}