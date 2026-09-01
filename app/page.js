// app/page.js (homepage)
import fs from "fs";
import path from "path";
import Notes from "./components/note";

export default function HomePage() {
  const filePath = path.join(process.cwd(), "public", "Danyil Niemtsov.md");
  
  let content = "Welcome to Mathalogical!";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Homepage file not found:", filePath, err);
  }

  return <Notes content={content} filename="Danyil Niemtsov.md" />;
}