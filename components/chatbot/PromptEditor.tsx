"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check } from "lucide-react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(customPrompt);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Define default prompt directly in the component
  const DEFAULT_PROMPT = `You are a friendly and helpful assistant. Be conversational and engaging in your responses.
Use the following pieces of context to answer the user's question.
If you don't know the answer, just say that you don't know, but maintain a friendly tone.
Make sure you only talk about this company. If user asks you something different, tell him, that you are only for answering questions about this company.`;

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      onPromptChange(tempPrompt);
    } else {
      // Start editing
      setTempPrompt(customPrompt);
    }
    setIsEditing(!isEditing);
  };

  const resetToDefault = () => {
    if (showResetConfirm) {
      setTempPrompt(DEFAULT_PROMPT);
      onPromptChange(DEFAULT_PROMPT);
      setShowResetConfirm(false);
      setIsEditing(false);
    } else {
      setShowResetConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-foreground">
          Custom System Prompt
        </Label>
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              disabled={isDisabled}
              className="h-8 px-2 text-primary"
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              disabled={isDisabled}
              className="h-8 px-2"
            >
              Edit
            </Button>
          )}
          <Button
            variant={showResetConfirm ? "destructive" : "outline"}
            size="sm"
            onClick={resetToDefault}
            disabled={isDisabled}
            className="h-8 px-2"
          >
            {showResetConfirm ? (
              "Confirm Reset"
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </>
            )}
          </Button>
        </div>
      </div>
      <Textarea
        value={isEditing ? tempPrompt : customPrompt}
        onChange={(e) => setTempPrompt(e.target.value)}
        disabled={!isEditing || isDisabled}
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
