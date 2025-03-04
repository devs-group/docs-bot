"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PromptEditorProps {
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  isDisabled?: boolean;
}

export function PromptEditor({
  customPrompt,
  onPromptChange,
  isDisabled = false,
}: PromptEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        Custom System Prompt
      </Label>
      <Textarea
        value={customPrompt}
        onChange={(e) => onPromptChange(e.target.value)}
        disabled={isDisabled}
        className="min-h-[120px] bg-background border-border text-foreground resize-y"
        placeholder="Enter custom instructions for the chatbot..."
      />
      <p className="text-xs text-muted-foreground">
        The prompt will be automatically completed with context and question
        placeholders if not included.
      </p>
    </div>
  );
}
