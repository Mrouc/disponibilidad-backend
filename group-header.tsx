import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";

interface GroupHeaderProps {
  group: Group;
  memberCount: number;
}

export default function GroupHeader({ group, memberCount }: GroupHeaderProps) {
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The group link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Share Group",
        description: `Share this link: ${url}`,
      });
    }
  };

  const handleInvite = () => {
    setShowInviteModal(true);
    // This will trigger the modal to open via a custom event
    window.dispatchEvent(new CustomEvent('openInviteModal'));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-medium text-neutral-900 mb-2">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-neutral-600">{group.description}</p>
          )}
          <p className="text-sm text-neutral-500 mt-1">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Group
          </Button>
          <Button onClick={handleInvite}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </div>
    </div>
  );
}
