import { Attachment } from "@/types";
import { generateId } from "@/utils/id";
import * as pdfjsLib from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function processFiles(files: FileList): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} exceeds 5MB limit`);
    }

    if (file.type.startsWith("image/")) {
      const content = await readFileAsDataURL(file);
      attachments.push({
        id: generateId(),
        name: file.name,
        content,
        type: "image",
      });
    } else if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      const content = await extractPdfText(file);
      attachments.push({
        id: generateId(),
        name: file.name,
        content,
        type: "text",
      });
    } else {
      const content = await readFileAsText(file);
      attachments.push({
        id: generateId(),
        name: file.name,
        content,
        type: "text",
      });
    }
  }

  return attachments;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    pages.push(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }

  return pages.join("\n\n");
}
