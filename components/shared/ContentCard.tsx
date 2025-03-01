"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ContentCardAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive" | "ghost";
}

interface ContentCardProps {
  id: string;
  title: string;
  createdAt: string | Date;
  tags?: Array<{
    label: string;
    type: "pdf" | "url" | string;
  }>;
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  actions?: ContentCardAction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  children?: React.ReactNode;
  preview?: React.ReactNode;
}

export function ContentCard({
  id,
  title,
  createdAt,
  tags = [],
  metadata = [],
  actions = [],
  onEdit,
  onDelete,
  children,
  preview,
}: ContentCardProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return (
      dateObj.toLocaleDateString() +
      " " +
      dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate">{title}</CardTitle>
          <div className="flex space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(id)}
                className="h-8 w-8 text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(createdAt)}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          {/* Metadata */}
          {metadata.length > 0 && (
            <div className="space-y-1">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center text-xs text-muted-foreground">
                  <span>{item.label}: {item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${
                    tag.type === "pdf"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : tag.type === "url"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {tag.label}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-2">
              {preview}
            </div>
          )}

          {/* Custom content */}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
