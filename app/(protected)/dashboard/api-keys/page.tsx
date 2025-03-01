"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, ArrowLeft, Copy, Key, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface NewApiKeyResponse {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState<NewApiKeyResponse | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/api-keys");
      setApiKeys(response.data.apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    try {
      const response = await axios.post("/api/api-keys", { name: newKeyName });
      setNewApiKey(response.data.apiKey);
      toast.success("API key created successfully");
      fetchApiKeys();
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await axios.delete(`/api/api-keys/${id}`);
      toast.success("API key deleted successfully");
      fetchApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const resetDialog = () => {
    setNewKeyName("");
    setNewApiKey(null);
    setIsKeyVisible(false);
    setIsCreateDialogOpen(false);
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
        <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New API Key
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
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
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Key className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No API keys yet</h3>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                Create an API key to access your chatbots programmatically.
                API keys provide secure access to your chatbots via the API.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                    <TableCell>
                      {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "Never"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          apiKey.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {apiKey.isActive ? "Active" : "Revoked"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={resetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newApiKey ? "API Key Created" : "Create New API Key"}
            </DialogTitle>
            {newApiKey && (
              <DialogDescription>
                Copy your API key now. You won't be able to see it again!
              </DialogDescription>
            )}
          </DialogHeader>

          {!newApiKey ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">API Key Name</Label>
                  <Input
                    id="name"
                    placeholder="My API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey}>Create API Key</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Your API Key</Label>
                  <div className="flex">
                    <Input
                      id="apiKey"
                      value={newApiKey.key}
                      readOnly
                      type={isKeyVisible ? "text" : "password"}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                    >
                      {isKeyVisible ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(newApiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Make sure to copy this key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={resetDialog}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
