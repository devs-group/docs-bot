"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface EmptyChatbotStateProps {
  onCreateClick: () => void;
}

export function EmptyChatbotState({ onCreateClick }: EmptyChatbotStateProps) {
  return (
    <Card className="w-full bg-card border-border shadow-lg">
      <CardContent className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Chatbot Created
          </h3>
          <p className="text-muted-foreground mb-6">
            You need to create a chatbot before you can test it. Go to the
            Create Chatbot tab.
          </p>
          <Button
            onClick={onCreateClick}
            variant="outline"
            className="bg-background text-foreground border-border"
          >
            Create a Chatbot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
