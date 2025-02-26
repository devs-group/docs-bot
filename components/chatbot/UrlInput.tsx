"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, LinkIcon } from "lucide-react";

interface UrlInputProps {
  urls: string[];
  setUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isDisabled: boolean;
  readOnly?: boolean;
}

export function UrlInput({ urls, setUrls, isDisabled, readOnly = false }: UrlInputProps) {
  const [newUrl, setNewUrl] = useState("");

  const addUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      setUrls([...urls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const removeUrl = (urlToRemove: string) => {
    if (!readOnly) {
      setUrls(urls.filter((url) => url !== urlToRemove));
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium text-foreground">
        {readOnly ? "URL Sources" : "Add URLs"}
      </Label>
      
      {!readOnly && (
        <div className="mt-2 flex gap-2">
          <Input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
            placeholder="https://example.com"
            disabled={isDisabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button
            type="button"
            onClick={addUrl}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isDisabled || !newUrl.trim()}
          >
            Add
          </Button>
        </div>
      )}
      
      {urls.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {readOnly ? "Sources" : "Added URLs:"}
          </p>
          {urls.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <div className="flex items-center space-x-2 truncate max-w-[95%]">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground truncate">
                  {url}
                </span>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(url)}
                  className="text-destructive hover:text-destructive/80 ml-2 flex-shrink-0"
                  disabled={isDisabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}