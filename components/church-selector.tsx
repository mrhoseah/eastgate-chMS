"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, Crown } from "lucide-react";
import { useChurchContext } from "@/lib/church-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function ChurchSelector() {
  const { churches, selectedChurchId, setSelectedChurchId, loading, currentChurch } = useChurchContext();
  const { data: session } = useSession();
  const router = useRouter();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";

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
    <div className="px-4 py-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/70">Church Context</p>
      <Select value={selectedChurchId || ""} onValueChange={(value) => {
        setSelectedChurchId(value);
        // Redirect to church dashboard when a church is selected
        if (value && isSuperAdmin) {
          router.push("/dashboard");
        }
      }}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2 truncate">
              <span className="truncate text-sm text-sidebar-foreground">
                {currentChurch?.name ?? "Select church"}
              </span>
              {currentChurch?.isSponsored && (
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {churches.map((church) => (
            <SelectItem key={church.id} value={church.id}>
              <div className="flex items-center gap-2">
                <span>{church.name}</span>
                {church.isSponsored && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isSuperAdmin && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => router.push("/sys-591f98aa001826fc")}
        >
          <Shield className="w-3 h-3 mr-2" />
          System Dashboard
        </Button>
      )}
    </div>
  );
}
