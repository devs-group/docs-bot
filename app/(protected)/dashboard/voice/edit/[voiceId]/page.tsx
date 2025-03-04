"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TwoStepVoiceGenerationForm } from "@/components/voice/TwoStepVoiceGenerationForm";
import { Toaster } from "@/components/ui/sonner";
import { use, useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface VoiceContent {
  id: string;
  name: string;
  content: string;
  voiceId: string;
  length: number;
  audioUrl: string;
  source?: {
    type: string;
    path: string;
  };
}

export default function EditVoicePage({ params }: { params: Promise<{ voiceId: string }> }) {
  const router = useRouter();
  const [voiceContent, setVoiceContent] = useState<VoiceContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { voiceId } = use(params) 

  useEffect(() => {
    const fetchVoiceContent = async () => {
      try {
        const response = await axios.get(`/api/voice/${voiceId}`);
        setVoiceContent(response.data);
      } catch (err) {
        console.error("Error fetching voice content:", err);
        setError("Failed to load voice content. It may have been deleted or you don't have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoiceContent();
  }, [voiceId]);

  const handleVoiceCreated = (voiceId: string) => {
    // Redirect to the dashboard after successful update
    console.log("Voice content updated with ID:", voiceId);
    router.push("/dashboard");
  };

  // Prepare the initial data for the form with source information
  const prepareInitialData = () => {
    if (!voiceContent) return undefined;

    return {
      id: voiceContent.id,
      name: voiceContent.name,
      content: voiceContent.content,
      voiceId: voiceContent.voiceId,
      length: voiceContent.length,
      audioUrl: voiceContent.audioUrl,
      sourceType: voiceContent.source?.type as "pdf" | "url" | "text",
      sourcePath: voiceContent.source?.path
    };
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          Edit Voice Content
        </h1>
      </div>

      <div className="p-1">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 bg-destructive/10 text-destructive rounded-md">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <TwoStepVoiceGenerationForm 
            onVoiceCreated={handleVoiceCreated} 
            initialData={prepareInitialData()}
          />
        )}
      </div>

      <Toaster />
    </div>
  );
}
