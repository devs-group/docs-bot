"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Code, Terminal } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ApiKey {
  id: string;
  name: string;
  key?: string;
}

interface ApiUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
}

export function ApiUsageDialog({
  open,
  onOpenChange,
  chatbotId,
}: ApiUsageDialogProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [noKeys, setNoKeys] = useState(false);

  useEffect(() => {
    if (open) {
      fetchApiKeys();
    }
  }, [open]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/api-keys");
      const keys = response.data.apiKeys;
      setApiKeys(keys);
      
      if (keys.length > 0) {
        setSelectedApiKey(keys[0].id);
        setNoKeys(false);
      } else {
        setNoKeys(true);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getBaseUrl = () => {
    // In a production environment, this would be your actual domain
    return typeof window !== "undefined" 
      ? `${window.location.protocol}//${window.location.host}`
      : "https://your-domain.com";
  };

  const getCurlExample = () => {
    return `curl -X POST "${getBaseUrl()}/api/chatbot/${chatbotId}/message" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"message": "Hello, how can you help me?"}'`;
  };

  const getNodeExample = () => {
    return `const axios = require('axios');

async function sendMessage() {
  try {
    const response = await axios.post(
      '${getBaseUrl()}/api/chatbot/${chatbotId}/message',
      { 
        message: 'Hello, how can you help me?' 
      },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        } 
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

sendMessage();`;
  };

  const getFetchExample = () => {
    return `fetch('${getBaseUrl()}/api/chatbot/${chatbotId}/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({ 
    message: 'Hello, how can you help me?' 
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
  };

  const navigateToApiKeys = () => {
    onOpenChange(false);
    window.location.href = "/dashboard/api-keys";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>API Usage</DialogTitle>
          <DialogDescription>
            Use your API key to interact with this chatbot programmatically
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-6">
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
        ) : noKeys ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Code className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No API keys available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You need to create an API key before you can use this chatbot via the API.
            </p>
            <Button onClick={navigateToApiKeys}>
              Create API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">API Endpoint</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`${getBaseUrl()}/api/chatbot/${chatbotId}/message`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-xs block overflow-x-auto p-2 whitespace-pre-wrap break-all">
                {`${getBaseUrl()}/api/chatbot/${chatbotId}/message`}
              </code>
            </div>

            <div className="text-sm mb-4">
              Replace <code className="text-xs bg-muted p-1 rounded">YOUR_API_KEY</code> with your actual API key from the{" "}
              <Button variant="link" className="p-0 h-auto" onClick={navigateToApiKeys}>
                API Keys page
              </Button>
            </div>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="node">Node.js</TabsTrigger>
                <TabsTrigger value="fetch">Fetch API</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curl" className="relative">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap break-all">
                    {getCurlExample()}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getCurlExample())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="node" className="relative">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap break-all">
                    {getNodeExample()}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getNodeExample())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="fetch" className="relative">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap break-all">
                    {getFetchExample()}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getFetchExample())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
