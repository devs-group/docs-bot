"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface VoicePromptEditorProps {
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  isDisabled?: boolean;
}

export function VoicePromptEditor({
  customPrompt,
  onPromptChange,
  isDisabled = false,
}: VoicePromptEditorProps) {
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
        placeholder="Enter custom instructions for the voice generation..."
      />
      <p className="text-xs text-muted-foreground">
        This prompt will guide how the AI summarizes and narrates your content.
      </p>
    </div>
  );
}
