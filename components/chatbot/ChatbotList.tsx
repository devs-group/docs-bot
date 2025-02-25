"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatbotTester } from "./ChatbotTester";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface Chatbot {
  id: string;
  name: string;
  createdAt: string;
  modelName: string;
  sources: { type: string; path: string }[];
}

export function ChatbotList() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    null,
  );
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/chatbot/list");
      setChatbots(response.data.chatbots);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      toast.error("Failed to load your chatbots");
    } finally {
      setLoading(false);
    }
  };

  const deleteChatbot = async (id: string) => {
    try {
      await axios.delete(`/api/chatbot/${id}`);
      setChatbots(chatbots.filter((bot) => bot.id !== id));
      toast.success("Chatbot deleted successfully");
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      toast.error("Failed to delete chatbot");
    }
  };

  const navigateToCreate = () => {
    router.push("/dashboard/chatbots/create");
  };

  const navigateToEdit = (id: string) => {
    router.push(`/dashboard/chatbots/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const generateNameFromSources = (
    sources: { type: string; path: string }[],
  ) => {
    if (!sources || sources.length === 0) return "Unnamed Chatbot";

    const sourceNames = sources.map((source) => {
      if (source.type === "pdf") {
        // Extract filename from path
        const parts = source.path.split("/");
        return parts[parts.length - 1];
      } else if (source.type === "url") {
        // Try to extract domain from URL
        try {
          const url = new URL(source.path);
          return url.hostname;
        } catch {
          return source.path;
        }
      }
      return source.type;
    });

    if (sourceNames.length === 1) return sourceNames[0];
    return `${sourceNames[0]} and ${sourceNames.length - 1} more`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Your Chatbots</h2>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={navigateToCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chatbot
        </Button>
      </div>

      {loading ? (
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
      ) : chatbots.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No chatbots yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You haven't created any chatbots yet. Create your first chatbot
                by clicking the "New Chatbot" button above.
              </p>
              <Button
                onClick={navigateToCreate}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Chatbot
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map((chatbot) => (
            <Card
              key={chatbot.id}
              className="bg-card border-border hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate">
                    {chatbot.name || generateNameFromSources(chatbot.sources)}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedChatbotId(chatbot.id);
                          setTestDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Test
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigateToEdit(chatbot.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteChatbot(chatbot.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Created: {formatDate(chatbot.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Model: {chatbot.modelName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {chatbot.sources.map((source, index) => (
                      <div
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          source.type === "pdf"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {source.type.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChatbotId(chatbot.id);
                      setTestDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToEdit(chatbot.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Keep the test dialog for testing directly from the list */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[800px] sm:h-[80vh]">
          <DialogHeader>
            <DialogTitle>Test Chatbot</DialogTitle>
            <DialogDescription>
              Chat with your AI assistant to test how it responds.
            </DialogDescription>
          </DialogHeader>
          {selectedChatbotId && <ChatbotTester chatbotId={selectedChatbotId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
