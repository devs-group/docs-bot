"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileUploader } from "../chatbot/FileUploader";
import { UrlInput } from "../chatbot/UrlInput";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChatbotSource } from "@/types/chatbot";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoicePromptEditor } from "./VoicePromptEditor";

// ElevenLabs voices
const AVAILABLE_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm and collected, perfect for storytelling" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Confident and friendly, good for explanations" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Warm and professional, ideal for business content" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Warm male voice with a British accent" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Approachable female voice with an American accent" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Deep male voice with an American accent" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Authoritative male voice with a British accent" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Versatile male voice with a neutral accent" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", description: "Versatile male voice with an American accent" },
];

interface TwoStepVoiceGenerationFormProps {
  onVoiceCreated?: (voiceId: string) => void;
  initialData?: {
    id?: string;
    name?: string;
    content?: string;
    voiceId?: string;
    length?: number;
  };
}

export function TwoStepVoiceGenerationForm({
  onVoiceCreated,
  initialData,
}: TwoStepVoiceGenerationFormProps) {
  // Form state
  const [currentStep, setCurrentStep] = useState<"source" | "content" | "voice">(
    initialData?.content ? "content" : "source"
  );
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  
  // Source inputs
  const [urls, setUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [inputType, setInputType] = useState<"pdf" | "url">("pdf");
  
  // Voice content
  const [voiceName, setVoiceName] = useState(initialData?.name || "");
  const [contentText, setContentText] = useState(initialData?.content || "");
  const [selectedVoice, setSelectedVoice] = useState(initialData?.voiceId || AVAILABLE_VOICES[0].id);
  const [contentLength, setContentLength] = useState(initialData?.length || 1); // 1-5 minutes
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Custom system prompt
  const [customPrompt, setCustomPrompt] = useState(
    "You are an AI assistant that summarizes documents and websites. Create a concise summary that captures the key points and main ideas of the content. The summary should be informative, well-structured, and maintain the original meaning."
  );

  // Validation functions
  const validateSourceStep = () => {
    if (inputType === "pdf" && files.length === 0) {
      toast.error("Please upload at least one PDF file.");
      return false;
    }
    
    if (inputType === "url" && urls.length === 0) {
      toast.error("Please add at least one URL.");
      return false;
    }
    
    return true;
  };

  const validateContentStep = () => {
    if (!voiceName.trim()) {
      toast.error("Please enter a name for your voice content.");
      return false;
    }
    
    if (!contentText.trim()) {
      toast.error("Content text cannot be empty.");
      return false;
    }
    
    return true;
  };

  // Handle text generation
  const handleGenerateText = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateSourceStep()) return;
    
    setIsGeneratingText(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add files or URLs based on the selected input type
      if (inputType === "pdf") {
        files.forEach((file) => formData.append("pdfs", file));
      } else {
        urls.forEach((url) => formData.append("urls", url));
      }
      
      // Add length parameter
      formData.append("length", contentLength.toString());
      
      // Add custom prompt
      formData.append("customPrompt", customPrompt);
      
      const response = await axios.post(`/api/voice/generate-text`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setContentText(response.data.summary);
      setCurrentStep("content");
      
      toast.success("Text summary generated successfully!");
    } catch (error) {
      console.error("Error generating text summary:", error);
      toast.error("Failed to generate text summary. Please try again.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Handle voice generation
  const handleGenerateVoice = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateContentStep()) return;
    
    setIsGeneratingVoice(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add content fields
      formData.append("name", voiceName);
      formData.append("content", contentText);
      formData.append("voiceId", selectedVoice);
      formData.append("length", contentLength.toString());
      formData.append("customPrompt", customPrompt);
      
      // If we're editing, also include the original source files/urls
      if (inputType === "pdf") {
        files.forEach((file) => formData.append("pdfs", file));
      } else {
        urls.forEach((url) => formData.append("urls", url));
      }
      
      const response = await axios.post(`/api/voice/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { voiceId, audioUrl } = response.data;
      setAudioUrl(audioUrl);
      setCurrentStep("voice");
      
      toast.success("Voice content generated successfully!");
      
      if (onVoiceCreated) onVoiceCreated(voiceId);
    } catch (error) {
      console.error("Error generating voice content:", error);
      toast.error("Failed to generate voice content. Please try again.");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <Card className="w-full bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {initialData?.id ? "Edit Voice Content" : "Generate Voice Content"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Step 1: Source Selection */}
        {currentStep === "source" && (
          <form onSubmit={handleGenerateText} className="space-y-6">
            {/* Voice Name */}
            <div className="space-y-2">
              <Label
                htmlFor="voice-name"
                className="text-sm font-medium text-foreground"
              >
                Voice Content Name
              </Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="bg-background border-border text-foreground"
                placeholder="Enter a name for your voice content"
                disabled={isGeneratingText}
                required
              />
            </div>

            {/* Input Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Input Type
              </Label>
              <Tabs 
                defaultValue={inputType} 
                className="w-full"
                onValueChange={(value) => setInputType(value as "pdf" | "url")}
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="pdf">PDF Document</TabsTrigger>
                  <TabsTrigger value="url">Website URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pdf" className="pt-4">
                  <FileUploader
                    files={files}
                    setFiles={setFiles}
                    isDisabled={isGeneratingText}
                  />
                </TabsContent>
                
                <TabsContent value="url" className="pt-4">
                  <UrlInput
                    urls={urls}
                    setUrls={setUrls}
                    isDisabled={isGeneratingText}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <Separator className="my-4" />

            {/* Content Length */}
            <div className="space-y-2">
              <Label
                htmlFor="content-length"
                className="text-sm font-medium text-foreground"
              >
                Content Length: {contentLength} {contentLength === 1 ? "minute" : "minutes"}
              </Label>
              <Slider
                id="content-length"
                min={1}
                max={5}
                step={1}
                value={[contentLength]}
                onValueChange={(value) => setContentLength(value[0])}
                disabled={isGeneratingText}
              />
              <p className="text-xs text-muted-foreground">
                Choose how long the voice content should be (1-5 minutes).
              </p>
            </div>

            {/* Custom System Prompt */}
            <VoicePromptEditor
              customPrompt={customPrompt}
              onPromptChange={setCustomPrompt}
              isDisabled={isGeneratingText}
            />

            {/* Generate Text Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
              disabled={isGeneratingText}
            >
              {isGeneratingText ? (
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
                  Generating Text...
                </>
              ) : (
                <>Generate Text</>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Content Editing */}
        {currentStep === "content" && (
          <form onSubmit={handleGenerateVoice} className="space-y-6">
            {/* Voice Name */}
            <div className="space-y-2">
              <Label
                htmlFor="voice-name-edit"
                className="text-sm font-medium text-foreground"
              >
                Voice Content Name
              </Label>
              <Input
                id="voice-name-edit"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="bg-background border-border text-foreground"
                placeholder="Enter a name for your voice content"
                disabled={isGeneratingVoice}
                required
              />
            </div>

            {/* Content Text */}
            <div className="space-y-2">
              <Label
                htmlFor="content-text"
                className="text-sm font-medium text-foreground"
              >
                Content Text
              </Label>
              <Textarea
                id="content-text"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="bg-background border-border text-foreground min-h-[200px]"
                placeholder="Edit the generated text or write your own content"
                disabled={isGeneratingVoice}
                required
              />
              <p className="text-xs text-muted-foreground">
                Edit the text above to customize what will be spoken in the voice content.
              </p>
            </div>

            <Separator className="my-4" />

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="voice-selection"
                className="text-sm font-medium text-foreground"
              >
                Select Voice
              </Label>
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={isGeneratingVoice}
              >
                <SelectTrigger id="voice-selection" className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Button Group */}
            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep("source")}
                disabled={isGeneratingVoice}
              >
                Back to Source
              </Button>
              
              <Button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isGeneratingVoice}
              >
                {isGeneratingVoice ? (
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
                    Generating Voice...
                  </>
                ) : (
                  <>Generate Voice</>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Voice Preview */}
        {currentStep === "voice" && audioUrl && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Generated Voice Content
              </Label>
              <div className="bg-muted p-4 rounded-md">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Content Text
              </Label>
              <div className="bg-muted p-4 rounded-md max-h-[300px] overflow-y-auto">
                <p className="text-sm">{contentText}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep("content")}
              >
                Edit Content
              </Button>
              
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (onVoiceCreated) {
                    onVoiceCreated("done");
                  }
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
