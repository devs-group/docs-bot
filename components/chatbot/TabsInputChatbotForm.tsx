"use client";

import { FormEvent, useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
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
import { ChatbotData } from "@/db/schema";
import { ChatbotSource } from "@/types/chatbot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsInputChatbotFormProps {
  existingChatbotId?: string; // If provided, we're in edit mode
  onChatbotCreated?: (chatbotId: string) => void;
  onChatbotUpdated?: () => void;
}

export function TabsInputChatbotForm({
  existingChatbotId,
  onChatbotCreated,
  onChatbotUpdated,
}: TabsInputChatbotFormProps) {
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
  const [activeTab, setActiveTab] = useState<"pdf" | "url" | "text">("pdf");
  const [directText, setDirectText] = useState<string>("");

  const isEditMode = !!existingChatbotId;

  // Load existing chatbot data if in edit mode
  useEffect(() => {
    if (existingChatbotId) {
      loadExistingChatbot(existingChatbotId);
    }
  }, [existingChatbotId, isEditMode]);

  const loadExistingChatbot = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/chatbot/${id}/details`);
      const data = response.data.chatbot as ChatbotData;

      // Set the form fields
      setChatbotName(data.name || "");
      setSelectedModel(data.config.modelName || "gpt-4o-mini");
      setCustomPrompt(data.config.customPrompt || DEFAULT_PROMPT_TEMPLATE);

      // In edit mode, we can't change sources at the moment, but we'll display them.
      if (data.sources) {
        const urlSources = data.sources
          .filter((source: ChatbotSource) => source.type === "url")
          .map((source: ChatbotSource) => source.path);
        
        const pdfSources = data.sources
          .filter((source: ChatbotSource) => source.type === "pdf");
        
        setUrls(urlSources);
        
        // Set the active tab based on the existing sources
        if (pdfSources.length > 0) {
          setActiveTab("pdf");
        } else if (urlSources.length > 0) {
          setActiveTab("url");
        }
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
    if (!isEditMode) {
      if (activeTab === "pdf" && files.length === 0) {
        toast.error("Please upload at least one document file.", {
          style: {
            background: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))",
          },
        });
        return;
      }
      
      if (activeTab === "url" && urls.length === 0) {
        toast.error("Please add at least one URL.", {
          style: {
            background: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))",
          },
        });
        return;
      }

      if (activeTab === "text" && !directText.trim()) {
        toast.error("Please enter some text.", {
          style: {
            background: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))",
          },
        });
        return;
      }
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

        // Add files and URLs based on the active tab
        if (activeTab === "pdf") {
          files.forEach((file) => formData.append("pdfs", file));
        }
        
        if (activeTab === "url") {
          urls.forEach((url) => formData.append("urls", url));
        }

        if (activeTab === "text") {
          formData.append("text", directText);
        }

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
              required
            />
          </div>

          {/* Input Type Selection - only in create mode */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Input Type
              </Label>
              <Tabs 
                value={activeTab} 
                className="w-full"
                onValueChange={(value) => setActiveTab(value as "pdf" | "url" | "text")}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="pdf">Documents</TabsTrigger>
                  <TabsTrigger value="url">Website URL</TabsTrigger>
                  <TabsTrigger value="text">Direct Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pdf" className="pt-4">
                  <FileUploader
                    files={files}
                    setFiles={setFiles}
                    isDisabled={isSubmitting}
                  />
                </TabsContent>
                
                <TabsContent value="url" className="pt-4">
                  <UrlInput
                    urls={urls}
                    setUrls={setUrls}
                    isDisabled={isSubmitting}
                  />
                </TabsContent>
                
                <TabsContent value="text" className="pt-4">
                  <Textarea
                    id="direct-text"
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    className="bg-background border-border text-foreground min-h-[200px]"
                    placeholder="Enter your text here"
                    disabled={isSubmitting}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* In edit mode, show the existing sources as read-only */}
          {isEditMode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Content Sources (Read-only)
              </Label>
              <Tabs value={activeTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="pdf" disabled>Documents</TabsTrigger>
                  <TabsTrigger value="url" disabled>Website URLs</TabsTrigger>
                  <TabsTrigger value="text" disabled>Direct Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pdf" className="pt-4">
                  <FileUploader
                    files={files}
                    setFiles={setFiles}
                    isDisabled={true}
                  />
                </TabsContent>
                
                <TabsContent value="url" className="pt-4">
                  <UrlInput
                    urls={urls}
                    setUrls={setUrls}
                    isDisabled={true}
                    readOnly={true}
                  />
                </TabsContent>
                
                <TabsContent value="text" className="pt-4">
                  <Textarea
                    id="direct-text"
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    className="bg-background border-border text-foreground min-h-[200px]"
                    placeholder="Enter your text here"
                    disabled={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

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
