"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  isDisabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  isDisabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  // Define models directly in the component
  const models = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4", name: "GPT-4" },
  ];

  return (
    <div className="space-y-2">
      <Label
        htmlFor="model-selector"
        className="text-sm font-medium text-foreground"
      >
        Select AI Model
      </Label>
      <Popover open={open && !isDisabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="model-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className="w-full justify-between bg-background border-border text-foreground"
          >
            {selectedModel
              ? models.find((model) => model.id === selectedModel)?.name ||
                "Select model..."
              : "Select model..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={(value) => {
                    onModelChange(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModel === model.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
