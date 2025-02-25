"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Terminal, Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CurlCommandDisplayProps {
  chatbotId: string;
}

export function CurlCommandDisplay({ chatbotId }: CurlCommandDisplayProps) {
  const curlCommand = `curl -X POST http://localhost:3000/api/chatbot/${chatbotId}/message -H "Content-Type: application/json" -d '{"message": "What can you tell me about this content?"}'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("cURL command copied to clipboard.", {
      style: {
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      },
    });
  };

  return (
    <div className="space-y-4">
      <Separator className="bg-border" />
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-foreground flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          Test your chatbot with cURL:
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(curlCommand)}
          className="text-primary hover:text-primary/80"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
      <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
        {curlCommand}
      </pre>
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        You can also test your chatbot in the Test Chatbot tab.
      </p>
      <p className="text-sm text-muted-foreground">
        Chatbot ID: <strong className="text-foreground">{chatbotId}</strong>
      </p>
    </div>
  );
}
