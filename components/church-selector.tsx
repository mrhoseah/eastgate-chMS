"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useChurchContext } from "@/lib/church-context";

export function ChurchSelector() {
  const { churches, selectedChurchId, setSelectedChurchId, loading, currentChurch } = useChurchContext();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading churches...
      </div>
    );
  }

  if (!churches.length) {
    return (
      <div className="px-4 py-3 text-xs text-gray-500">
        No churches available for selection.
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/70">Church Context</p>
      <Select value={selectedChurchId || ""} onValueChange={setSelectedChurchId}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue>
            <div className="flex items-center gap-2 truncate">
              <span className="truncate text-sm text-sidebar-foreground">
                {currentChurch?.name ?? "Select church"}
              </span>
              {currentChurch?.isSponsored && (
                <Badge className="text-[10px] bg-emerald-600 text-white px-1 py-0.5">
                  Sponsored
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {churches.map((church) => (
            <SelectItem key={church.id} value={church.id} className="flex items-center justify-between">
              <span>{church.name}</span>
              {church.isSponsored && (
                <Badge className="text-[10px] bg-emerald-600 text-white px-1 py-0.5">
                  Sponsored
                </Badge>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
