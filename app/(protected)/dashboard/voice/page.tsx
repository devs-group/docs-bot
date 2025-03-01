"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { VoiceContent } from "@/types/chatbot";
import { toast } from "sonner";

export default function VoicePage() {
  const router = useRouter();
  const [voiceContent, setVoiceContent] = useState<VoiceContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVoiceContent();
  }, []);

  const fetchVoiceContent = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/voice/list");
      setVoiceContent(response.data.voiceContent);
    } catch (error) {
      console.error("Error fetching voice content:", error);
      toast.error("Failed to load voice content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/voice/${id}`);
      toast.success("Voice content deleted successfully");
      fetchVoiceContent();
    } catch (error) {
      console.error("Error deleting voice content:", error);
      toast.error("Failed to delete voice content");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Voice Content</h1>
        <Button
          onClick={() => router.push("/dashboard/voice/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      {isLoading ? (
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
      ) : voiceContent.length === 0 ? (
        <div className="text-center p-12">
          <p className="text-muted-foreground">
            You haven&apos;t created any voice content yet.
          </p>
          <Button
            onClick={() => router.push("/dashboard/voice/create")}
            className="mt-4"
          >
            Create Your First Voice Content
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {voiceContent.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md max-h-32 overflow-y-auto">
                    <p className="text-sm text-foreground line-clamp-4">
                      {item.content.substring(0, 200)}...
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Audio ({item.length} min)</p>
                    {item.audioUrl ? (
                      <audio controls className="w-full">
                        <source src={item.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Audio not available
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
