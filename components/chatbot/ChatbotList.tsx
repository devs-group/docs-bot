"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MessageSquare, Code } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatbotTester } from "./ChatbotTester";
import { ApiUsageDialog } from "./ApiUsageDialog";
import { useRouter } from "next/navigation";
import { ChatbotData } from "@/db/schema";
import { ContentCard, ContentCardAction } from "@/components/shared/ContentCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export function ChatbotList() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<ChatbotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    null,
  );
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [selectedChatbotForApi, setSelectedChatbotForApi] = useState<string | null>(null);

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

  const navigateToEdit = (id: string) => {
    router.push(`/dashboard/chatbots/edit/${id}`);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSpinner size="lg" className="p-12" />
      ) : chatbots.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <EmptyState
              title="No chatbots yet"
              description="You have not created any chatbots yet. Create your first chatbot by clicking the button below."
              icon={<MessageSquare className="h-12 w-12" />}
              actionLabel="Create Your First Chatbot"
              onAction={() => router.push("/dashboard/chatbots/create")}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map((chatbot) => {
            const actions: ContentCardAction[] = [
              {
                icon: <Code className="h-4 w-4 mr-2" />,
                label: "API",
                onClick: () => {
                  setSelectedChatbotForApi(chatbot.id);
                  setApiDialogOpen(true);
                },
                variant: "default"
              },
              {
                icon: <MessageSquare className="h-4 w-4 mr-2" />,
                label: "Test",
                onClick: () => {
                  setSelectedChatbotId(chatbot.id);
                  setTestDialogOpen(true);
                },
                variant: "default"
              },
              {
                icon: <Trash2 className="h-4 w-4 mr-2" />,
                label: "Delete",
                onClick: () => deleteChatbot(chatbot.id),
                variant: "destructive"
              }
            ];

            return (
              <ContentCard
                key={chatbot.id}
                id={chatbot.id}
                title={chatbot.name}
                createdAt={chatbot.createdAt}
                onEdit={navigateToEdit}
                tags={chatbot.sources.map((source) => ({
                  label: source.type.toUpperCase(),
                  type: source.type
                }))}
                metadata={[
                  { label: "Model", value: chatbot.config.modelName || "Default" }
                ]}
                actions={actions}
              />
            );
          })}
        </div>
      )}

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogTitle>Chatbot</DialogTitle>
          <div className="p-4">
            {selectedChatbotId && (
              <ChatbotTester chatbotId={selectedChatbotId} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedChatbotForApi && (
        <ApiUsageDialog
          open={apiDialogOpen}
          onOpenChange={setApiDialogOpen}
          chatbotId={selectedChatbotForApi}
        />
      )}
    </div>
  );
}
