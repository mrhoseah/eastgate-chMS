"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, MessageSquare, Send, Video, Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'owner';
  avatar?: string;
  isOnline: boolean;
  currentFrame?: string;
}

interface Comment {
  id: string;
  frameId: string;
  author: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
}

interface CollaborationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationId: string;
}

export function CollaborationPanel({ open, onOpenChange, presentationId }: CollaborationPanelProps) {
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: '1', name: 'You', email: 'you@church.com', role: 'owner', isOnline: true },
  ]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Generate share link
    const link = `${window.location.origin}/presentations/${presentationId}/collaborate`;
    setShareLink(link);
  }, [presentationId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleInvite = () => {
    toast({
      title: "Invite Sent",
      description: "Invitation feature coming soon",
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `comment_${Date.now()}`,
      frameId: 'current',
      author: 'You',
      content: newComment,
      timestamp: new Date(),
      resolved: false,
    };
    
    setComments([...comments, comment]);
    setNewComment('');
    toast({
      title: "Comment Added",
      description: "Your comment has been added",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaboration
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Invite team members and collaborate in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Share Link */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-700 border-gray-600 text-white text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="border-gray-700 text-gray-300"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInvite}
                className="border-gray-700 text-gray-300"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>

          {/* Collaborators */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Active Collaborators</label>
              <span className="text-xs text-gray-400">{collaborators.length} online</span>
            </div>
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg p-2">
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {collab.name.charAt(0).toUpperCase()}
                      </div>
                      {collab.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{collab.name}</div>
                      <div className="text-xs text-gray-400 truncate">{collab.email}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300">
                      {collab.role}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Comments</label>
              <span className="text-xs text-gray-400">{comments.length} comments</span>
            </div>
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg p-2 mb-2">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-2">Add comments to collaborate with your team</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-white">{comment.author}</div>
                          <div className="text-xs text-gray-400">
                            {comment.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {comment.resolved && (
                          <span className="text-xs text-green-400">Resolved</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

