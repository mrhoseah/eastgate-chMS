"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PresentationBuilderPage() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to editor
    if (params.id) {
      router.replace(`/dashboard/presentations/${params.id}/editor`);
    }
  }, [params.id, router]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-200">Redirecting to editor...</p>
        </div>
      </div>
    </div>
  );
}
