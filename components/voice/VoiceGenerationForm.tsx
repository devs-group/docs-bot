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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChatbotSource } from "@/types/chatbot";
import { v4 as uuidv4 } from "uuid";

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

interface VoiceGenerationFormProps {
  onVoiceCreated?: (voiceId: string) => void;
}

export function VoiceGenerationForm({
  onVoiceCreated,
}: VoiceGenerationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id);
  const [contentLength, setContentLength] = useState(1); // 1-5 minutes
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!files.length && !urls.length) {
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
      // Create form data
      const formData = new FormData();

      // Add files and URLs
      files.forEach((file) => formData.append("pdfs", file));
      urls.forEach((url) => formData.append("urls", url));

      // Add other fields
      formData.append("name", voiceName);
      formData.append("voiceId", selectedVoice);
      formData.append("length", contentLength.toString());

      const response = await axios.post(`/api/voice/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { voiceId, audioUrl } = response.data;
      setAudioUrl(audioUrl);

      toast.success("Voice content generated successfully!", {
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
        },
      });

      if (onVoiceCreated) onVoiceCreated(voiceId);
    } catch (error) {
      console.error("Error generating voice content:", error);
      toast.error("Failed to generate voice content. Please try again.", {
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Generate Voice Content</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload */}
          <FileUploader
            files={files}
            setFiles={setFiles}
            isDisabled={isSubmitting}
          />

          {/* URL Input */}
          <UrlInput
            urls={urls}
            setUrls={setUrls}
            isDisabled={isSubmitting}
          />

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
              disabled={isSubmitting}
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

          {/* Content Length */}
          <div className="space-y-2">
            <Label
              htmlFor="content-length"
              className="text-sm font-medium text-foreground"
            >
              Content Length: {contentLength} minute{contentLength !== 1 ? 's' : ''}
            </Label>
            <Slider
              id="content-length"
              min={1}
              max={5}
              step={1}
              value={[contentLength]}
              onValueChange={(value) => setContentLength(value[0])}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

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
                Generating Voice Content...
              </>
            ) : (
              <>Generate Voice Content</>
            )}
          </Button>
        </form>

        {/* Audio Player (if audio is generated) */}
        {audioUrl && (
          <div className="mt-6 space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Generated Audio
            </Label>
            <div className="bg-muted p-4 rounded-md">
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
