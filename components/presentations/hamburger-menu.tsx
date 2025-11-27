"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Save, 
  Copy, 
  FileDown, 
  FileText, 
  CheckSquare, 
  Share2, 
  Users, 
  Play,
  Printer,
  Settings,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HamburgerMenuProps {
  onSave?: () => void;
  onExportPDF?: () => void;
  onExportPPTX?: () => void;
  onShare?: () => void;
  onCollaborate?: () => void;
  onPresent?: () => void;
}

export function HamburgerMenu({
  onSave,
  onExportPDF,
  onExportPPTX,
  onShare,
  onCollaborate,
  onPresent
}: HamburgerMenuProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    toast({
      title: "Presentation Copied",
      description: "A copy of this presentation has been created.",
    });
  };

  const handleSpellCheck = () => {
    toast({
      title: "Spell Check",
      description: "Spell check enabled. Errors will be underlined.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Presentation</DropdownMenuLabel>
        <DropdownMenuItem onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          <span>Save</span>
          <span className="ml-auto text-xs text-gray-500">Ctrl+S</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Make a Copy</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              <span>PDF Document (.pdf)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPPTX}>
              <FileDown className="mr-2 h-4 w-4" />
              <span>PowerPoint (.pptx)</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCollaborate}>
          <Users className="mr-2 h-4 w-4" />
          <span>Collaborate</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSpellCheck}>
          <CheckSquare className="mr-2 h-4 w-4" />
          <span>Spell Check</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPresent}>
          <Play className="mr-2 h-4 w-4" />
          <span>Present</span>
          <span className="ml-auto text-xs text-gray-500">F5</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
