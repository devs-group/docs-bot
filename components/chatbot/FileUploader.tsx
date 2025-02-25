"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";

interface FileUploaderProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isDisabled: boolean;
}

export function FileUploader({
  files,
  setFiles,
  isDisabled,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).filter(
        (file) => !files.some((f) => f.name === file.name), // Prevent duplicates
      );
      setFiles((prev) => [...prev, ...newFiles]);
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  return (
    <div>
      <Label className="text-sm font-medium text-foreground">
        Upload PDF Files
      </Label>
      <div className="mt-2 flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer bg-background hover:bg-muted transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">PDF files only</p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf"
            disabled={isDisabled}
            onChange={handleFileChange}
          />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Uploaded PDFs:</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <span className="text-sm text-foreground truncate max-w-xs">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file)}
                className="text-destructive hover:text-destructive/80"
                disabled={isDisabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
