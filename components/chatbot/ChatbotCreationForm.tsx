"use client";

import { FormEvent, useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Github, Save } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { UrlInput } from "./UrlInput";
import { CurlCommandDisplay } from "./CurlCommandDisplay";
import { ModelSelector } from "./ModelSelector";
import { PromptEditor } from "./PromptEditor";
import { AVAILABLE_MODELS, DEFAULT_PROMPT_TEMPLATE } from "@/lib/constants";

interface ChatbotCreationFormProps {
  existingChatbotId?: string; // If provided, we're in edit mode
  onChatbotCreated?: (chatbotId: string) => void;
  onChatbotUpdated?: () => void;
}

export function ChatbotCreationForm({
  existingChatbotId,
  onChatbotCreated,
  onChatbotUpdated,
}: ChatbotCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [chatbotId, setChatbotId] = useState<string>(existingChatbotId || "");
  const [showCurlCommand, setShowCurlCommand] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [chatbotName, setChatbotName] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    AVAILABLE_MODELS.find((model) => model.default)?.id ||
      AVAILABLE_MODELS[0].id,
  );
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [sourcesReadOnly, setSourcesReadOnly] = useState(false);

  const isEditMode = !!existingChatbotId;

  // Load existing chatbot data if in edit mode
  useEffect(() => {
    if (isEditMode && existingChatbotId) {
      loadExistingChatbot(existingChatbotId);
    }
  }, [existingChatbotId, isEditMode]);

  const loadExistingChatbot = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/chatbot/${id}/details`);
      const data = response.data.chatbot;

      // Set the form fields
      setChatbotName(data.name || "");
      setSelectedModel(data.modelName || "gpt-4o-mini");
      setCustomPrompt(data.customPrompt || DEFAULT_PROMPT_TEMPLATE);

      // In edit mode, we can't change sources, but we'll display them
      if (data.sources) {
        const urlSources = data.sources
          .filter((source: any) => source.type === "url")
          .map((source: any) => source.path);
        setUrls(urlSources);
      }

      // Sources are read-only in edit mode
      setSourcesReadOnly(true);
    } catch (error) {
      console.error("Error loading chatbot details:", error);
      toast.error("Failed to load chatbot details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form based on mode
    if (!isEditMode && !files.length && !urls.length) {
      toast.error("Please upload at least one PDF or add a URL.", {
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
        },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing chatbot
        await axios.patch(`/api/chatbot/${existingChatbotId}`, {
          name: chatbotName,
          modelName: selectedModel,
          customPrompt: customPrompt,
        });

        toast.success("Chatbot updated successfully!", {
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          },
        });

        if (onChatbotUpdated) onChatbotUpdated();
      } else {
        // Create new chatbot
        setShowCurlCommand(false);
        const formData = new FormData();

        // Add files and URLs
        files.forEach((file) => formData.append("pdfs", file));
        urls.forEach((url) => formData.append(`urls[]`, url));

        // Add other fields
        formData.append("name", chatbotName);
        formData.append("model", selectedModel);
        formData.append("customPrompt", customPrompt);

        const response = await axios.post(`/api/chatbot/init`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newChatbotId = response.data.chatbotId;
        setChatbotId(newChatbotId);
        setShowCurlCommand(true);

        toast.success("Chatbot created successfully!", {
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          },
        });

        if (onChatbotCreated) onChatbotCreated(newChatbotId);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} chatbot:`,
        error,
      );
      toast.error(
        `Failed to ${isEditMode ? "update" : "create"} chatbot. Please try again.`,
        {
          style: {
            background: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))",
          },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Card className="w-full bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isEditMode ? "Edit" : "Create a New"} Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chatbot Name */}
          <div className="space-y-2">
            <Label
              htmlFor="chatbot-name"
              className="text-sm font-medium text-foreground"
            >
              Chatbot Name
            </Label>
            <Input
              id="chatbot-name"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              className="bg-background border-border text-foreground"
              placeholder="Enter a name for your chatbot"
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload - only available in create mode */}
          {!isEditMode && (
            <FileUploader
              files={files}
              setFiles={setFiles}
              isDisabled={isSubmitting}
            />
          )}

          {/* URL Input - read-only in edit mode */}
          <UrlInput
            urls={urls}
            setUrls={setUrls}
            isDisabled={isSubmitting || sourcesReadOnly}
            readOnly={sourcesReadOnly}
          />

          <Separator className="my-4" />

          {/* Model Selector */}
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isDisabled={isSubmitting}
          />

          {/* Prompt Editor */}
          <PromptEditor
            customPrompt={customPrompt}
            onPromptChange={setCustomPrompt}
            isDisabled={isSubmitting}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isEditMode ? "Updating" : "Creating"} Chatbot...
              </>
            ) : (
              <>
                {isEditMode ? (
                  <>
                    <Save className="h-5 w-5" />
                    Update Chatbot
                  </>
                ) : (
                  <>
                    <Github className="h-5 w-5" />
                    Create Chatbot
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        {/* cURL Command - only show in create mode when chatbot is created */}
        {!isEditMode && showCurlCommand && (
          <CurlCommandDisplay chatbotId={chatbotId} />
        )}
      </CardContent>
    </Card>
  );
}
