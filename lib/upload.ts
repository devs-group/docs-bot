import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { NextRequest } from "next/server";

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), "uploads");

export const ensureUploadDir = async () => {
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export const saveFile = async (
  fileName: string,
  data: Buffer,
): Promise<string> => {
  await ensureUploadDir();
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${timestamp}-${safeName}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, data);
  return filepath;
};

export const readFile = async (filepath: string): Promise<Buffer> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs").promises;
  return fs.readFile(filepath);
};

export const parseFormData = async (req: NextRequest) => {
  const formData = await req.formData();
  const files: { name: string; path: string }[] = [];
  const fields: Record<string, string | string[]> = {};

  // Process each form field
  for (const [key, value] of formData.entries()) {
    // Handle file uploads
    if (value instanceof Blob) {
      const buffer = Buffer.from(await value.arrayBuffer());
      const fileName = (value as File).name;
      const filePath = await saveFile(fileName, buffer);

      files.push({
        name: fileName,
        path: filePath,
      });
    }
    // Handle array fields (like urls[])
    else if (key.endsWith("[]")) {
      const cleanKey = key.slice(0, -2);
      if (!fields[cleanKey]) {
        fields[cleanKey] = [];
      }
      if (Array.isArray(fields[cleanKey])) {
        (fields[cleanKey] as string[]).push(value.toString());
      }
    }
    // Handle normal fields
    else {
      fields[key] = value.toString();
    }
  }

  return { fields, files };
};
