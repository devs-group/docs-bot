"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowLeft, Pencil, Mic, Download } from "lucide-react";
import { VoiceContent } from "@/types/chatbot";
import { toast } from "sonner";
import { ContentCard, ContentCardAction } from "@/components/shared/ContentCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

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

  const handleEdit = (id: string) => {
    router.push(`/dashboard/voice/edit/${id}`);
  };

  const handleDownload = (audioUrl: string, name: string) => {
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
        a.download = `${name.replace(/\s+/g, '_')}_audio.mp3`;
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
        a.download = `${name.replace(/\s+/g, '_')}_audio.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success("Audio download started");
      }
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast.error("Failed to download audio");
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
        <LoadingSpinner size="lg" className="p-12" />
      ) : voiceContent.length === 0 ? (
        <div className="text-center p-12">
          <EmptyState
            title="No voice content yet"
            description="You have not created any voice content yet. Create your first voice content by clicking the button below."
            icon={<Mic className="h-12 w-12" />}
            actionLabel="Create Your First Voice Content"
            onAction={() => router.push("/dashboard/voice/create")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {voiceContent.map((item) => {
            const actions: ContentCardAction[] = [
              {
                icon: <Download className="h-4 w-4 mr-2" />,
                label: "Download Audio",
                onClick: () => handleDownload(item.audioUrl || '', item.name),
                variant: "default"
              },
              {
                icon: <Trash2 className="h-4 w-4 mr-2" />,
                label: "Delete",
                onClick: () => handleDelete(item.id),
                variant: "destructive"
              }
            ];
            
            return (
              <ContentCard
                key={item.id}
                id={item.id}
                title={item.name}
                createdAt={item.createdAt}
                onEdit={handleEdit}
                actions={actions}
                tags={[
                  {
                    label: item.source?.type?.toUpperCase() || "UNKNOWN",
                    type: item.source?.type || "unknown",
                  },
                ]}
                metadata={[
                  { label: "Length", value: `${item.length} min` },
                  { label: "Voice", value: item.voiceId }
                ]}
                preview={
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md max-h-32 overflow-y-auto">
                      <p className="text-sm text-foreground line-clamp-4">
                        {item.content.substring(0, 200)}...
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Audio</p>
                      {item.audioUrl ? (
                        <div className="space-y-2">
                          <audio controls className="w-full">
                            <source src={item.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Audio not available
                        </p>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
