"use client";

import { FormEvent, useState, useEffect } from "react";
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
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { ChatbotSource } from "@/types/chatbot";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoicePromptEditor } from "./VoicePromptEditor";
import { Download } from "lucide-react";

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
    sourceType?: "pdf" | "url" | "text";
    sourcePath?: string;
    audioUrl?: string;
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
  const [urls, setUrls] = useState<string[]>(initialData?.sourceType === "url" && initialData.sourcePath ? [initialData.sourcePath] : []);
  const [files, setFiles] = useState<File[]>([]);
  const [inputType, setInputType] = useState<"pdf" | "url" | "text">(
    initialData?.sourceType === "url" ? "url" : 
    initialData?.sourceType === "text" ? "text" : "pdf"
  );
  const [directText, setDirectText] = useState<string>(
    initialData?.sourceType === "text" && initialData.sourcePath ? initialData.sourcePath : ""
  );

  // Voice content
  const [voiceName, setVoiceName] = useState(initialData?.name || "");
  const [contentText, setContentText] = useState(initialData?.content || "");
  const [selectedVoice, setSelectedVoice] = useState(initialData?.voiceId || AVAILABLE_VOICES[0].id);
  const [contentLength, setContentLength] = useState(initialData?.length || 1); // 1-5 minutes
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audioUrl || null);
  
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
    
    if (inputType === "text" && !directText.trim()) {
      toast.error("Please enter some text.");
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
  const handleGenerateText = async () => {
    if (!validateSourceStep()) return;
    
    setIsGeneratingText(true);
    
    try {
      const formData = new FormData();
      
      // Add files or URLs based on the selected input type
      if (inputType === "pdf") {
        files.forEach((file) => formData.append("pdfs", file));
      } else if (inputType === "url") {
        urls.forEach((url) => formData.append("urls", url));
      } else if (inputType === "text") {
        formData.append("directText", directText);
      }
      
      // Add length parameter
      formData.append("length", String(contentLength));
      
      // Add custom prompt if provided
      if (customPrompt.trim()) {
        formData.append("customPrompt", customPrompt);
      }
      
      const response = await axios.post("/api/voice/generate-text", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      if (response.data.summary) {
        setContentText(response.data.summary);
        setCurrentStep("content");
        
        toast.success("Text summary generated successfully!");
      } else {
        toast.error("Failed to generate text summary. Please try again.");
      }
    } catch (error) {
      console.error("Error generating text:", error);
      toast.error("An error occurred while generating the text summary.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Handle text regeneration
  const handleRegenerateText = async () => {
    if (!validateSourceStep()) return;
    
    setIsGeneratingText(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add files or URLs based on the selected input type
      if (inputType === "pdf") {
        files.forEach((file) => formData.append("pdfs", file));
      } else if (inputType === "url") {
        urls.forEach((url) => formData.append("urls", url));
      } else if (inputType === "text") {
        formData.append("text", directText);
      }
      
      // Add length parameter
      formData.append("length", contentLength.toString());
      
      // Add custom prompt
      formData.append("customPrompt", customPrompt);
      
      const response = await axios.post(`/api/voice/generate-text`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setContentText(response.data.summary);
      
      toast.success("Text summary regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating text summary:", error);
      toast.error("Failed to regenerate text summary. Please try again.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Handle voice generation
  const handleGenerateVoice = async () => {
    if (!validateContentStep()) return;
    
    setIsGeneratingVoice(true);
    
    try {
      const formData = new FormData();
      
      // Add voice content details
      formData.append("name", voiceName);
      formData.append("content", contentText);
      formData.append("voiceId", selectedVoice);
      formData.append("length", String(contentLength));
      
      // If we're editing, also include the original source files/urls
      if (inputType === "pdf") {
        files.forEach((file) => formData.append("pdfs", file));
      } else if (inputType === "url") {
        urls.forEach((url) => formData.append("urls", url));
      } else if (inputType === "text") {
        formData.append("text", directText);
      }
      
      const response = await axios.post(`/api/voice/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.id) {
        toast.success("Voice content generated successfully!");
        // router.push("/dashboard/voice");
      } else {
        toast.error("Failed to generate voice content. Please try again.");
      }
    } catch (error) {
      console.error("Error generating voice:", error);
      toast.error("An error occurred while generating the voice content.");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Handle voice regeneration
  const handleRegenerateVoice = async () => {
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
      } else if (inputType === "url") {
        urls.forEach((url) => formData.append("urls", url));
      } else if (inputType === "text") {
        formData.append("text", directText);
      }
      
      const response = await axios.post(`/api/voice/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { voiceId, audioUrl } = response.data;
      setAudioUrl(audioUrl);
      
      toast.success("Voice content regenerated successfully!");
      
      if (onVoiceCreated) onVoiceCreated(voiceId);
    } catch (error) {
      console.error("Error regenerating voice content:", error);
      toast.error("Failed to regenerate voice content. Please try again.");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  useEffect(() => {
    // If we have initial data in edit mode, set the appropriate input type and content
    if (initialData) {
      // Set the voice name and content
      setVoiceName(initialData.name || "");
      setContentText(initialData.content || "");
      
      // Set the voice ID and length
      setSelectedVoice(initialData.voiceId || AVAILABLE_VOICES[0].id);
      setContentLength(initialData.length || 1);
      
      // Set the audio URL if available
      if (initialData.audioUrl) {
        setAudioUrl(initialData.audioUrl);
      }
      
      // Set the input type and source content based on the source type
      if (initialData.sourceType) {
        setInputType(initialData.sourceType as "pdf" | "url" | "text");
        
        if (initialData.sourceType === "url" && initialData.sourcePath) {
          setUrls([initialData.sourcePath]);
        } else if (initialData.sourceType === "text" && initialData.sourcePath) {
          setDirectText(initialData.sourcePath);
        }
      }
    }
  }, [initialData]);

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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                onValueChange={(value) => setInputType(value as "pdf" | "url" | "text")}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="pdf">Documents</TabsTrigger>
                  <TabsTrigger value="url">Website URL</TabsTrigger>
                  <TabsTrigger value="text">Direct Text Input</TabsTrigger>
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
                
                <TabsContent value="text" className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="direct-text" className="text-sm font-medium text-foreground">
                      Enter or paste your text
                    </Label>
                    <Textarea
                      id="direct-text"
                      value={directText}
                      onChange={(e) => setDirectText(e.target.value)}
                      className="min-h-[200px] bg-background border-border text-foreground"
                      placeholder="Enter or paste your text here..."
                      disabled={isGeneratingText}
                    />
                  </div>
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
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
              disabled={isGeneratingText}
              onClick={handleGenerateText}
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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                Generated Content
              </Label>
              <Textarea
                id="content-text"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="min-h-[200px] bg-background border-border text-foreground"
                placeholder="Your generated content will appear here"
                disabled={isGeneratingVoice}
              />
            </div>

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
              >
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>ElevenLabs Voices</SelectLabel>
                    {AVAILABLE_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep("source")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isGeneratingVoice}
                onClick={handleGenerateVoice}
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
                    Generating...
                  </>
                ) : (
                  "Generate Voice"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Voice Preview */}
        {currentStep === "voice" && audioUrl && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-foreground">
                  Generated Voice Content
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateVoice}
                  disabled={isGeneratingVoice}
                  className="h-8 px-3 text-xs"
                >
                  {isGeneratingVoice ? (
                    <>
                      <svg
                        className="animate-spin h-3 w-3 mr-1"
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
                      Regenerating...
                    </>
                  ) : (
                    <>Regenerate Voice</>
                  )}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                {audioUrl && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2 flex items-center justify-center gap-2"
                    onClick={() => {
                      try {
                        // For data URLs, we need to convert from base64 to a blob
                        if (audioUrl.startsWith('data:')) {
                          // Extract the base64 part
                          const base64Data = audioUrl.split(',')[1];
                          const byteCharacters = atob(base64Data);
                          const byteArrays = [];
                          
                          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                            const slice = byteCharacters.slice(offset, offset + 512);
                            
                            const byteNumbers = new Array(slice.length);
                            for (let i = 0; i < slice.length; i++) {
                              byteNumbers[i] = slice.charCodeAt(i);
                            }
                            
                            const byteArray = new Uint8Array(byteNumbers);
                            byteArrays.push(byteArray);
                          }
                          
                          const blob = new Blob(byteArrays, { type: 'audio/mpeg' });
                          const url = URL.createObjectURL(blob);
                          
                          // Create download link
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${voiceName || 'voice_content'}_audio.mp3`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          
                          // Clean up the URL
                          setTimeout(() => URL.revokeObjectURL(url), 100);
                          
                          toast.success("Audio download started");
                        } else {
                          // Regular URL
                          const a = document.createElement('a');
                          a.href = audioUrl;
                          a.download = `${voiceName || 'voice_content'}_audio.mp3`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          
                          toast.success("Audio download started");
                        }
                      } catch (error) {
                        console.error("Error downloading audio:", error);
                        toast.error("Failed to download audio");
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download Audio
                  </Button>
                )}
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
