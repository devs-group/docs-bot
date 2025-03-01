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

  // Get file type icon or color based on extension
  const getFileTypeInfo = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch(extension) {
      case 'pdf':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      case 'md':
      case 'markdown':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'txt':
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
      case 'json':
        return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
      case 'docx':
      case 'doc':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'xlsx':
      case 'xls':
        return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' };
      case 'pptx':
      case 'ppt':
        return { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
      default:
        return { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium text-foreground">
        Upload Document Files
      </Label>
      <div className="mt-2 flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer bg-background hover:bg-muted transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, Markdown, Text, JSON, DOCX, XLSX, PPTX files
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.md,.markdown,.txt,.json,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
            disabled={isDisabled}
            onChange={handleFileChange}
          />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Uploaded Files:</p>
          {files.map((file, index) => {
            const { color } = getFileTypeInfo(file.name);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
                    {file.name.split('.').pop()?.toUpperCase()}
                  </span>
                  <span className="text-sm text-foreground truncate max-w-xs">
                    {file.name}
                  </span>
                </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
