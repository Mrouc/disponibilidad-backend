import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InviteMemberModalProps {
  groupId: string;
}

export default function InviteMemberModal({ groupId }: InviteMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openInviteModal', handleOpenModal);
    return () => window.removeEventListener('openInviteModal', handleOpenModal);
  }, []);

  const inviteMutation = useMutation({
    mutationFn: async (memberData: { name: string; email: string }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/members`, {
        ...memberData,
        isCreator: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emails.trim()) {
      toast({
        title: "Email addresses required",
        description: "Please enter at least one email address.",
        variant: "destructive",
      });
      return;
    }

    const emailList = emails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailList.length === 0) {
      toast({
        title: "Invalid email addresses",
        description: "Please enter valid email addresses.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create members for each email
      for (const email of emailList) {
        const name = email.split('@')[0]; // Simple name extraction
        await inviteMutation.mutateAsync({ name, email });
      }

      toast({
        title: "Invitations sent!",
        description: `Successfully invited ${emailList.length} ${emailList.length === 1 ? 'member' : 'members'}.`,
      });

      setIsOpen(false);
      setEmails("");
      setMessage("");
    } catch (error) {
      toast({
        title: "Error sending invitations",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="emails" className="text-sm font-medium text-neutral-700">
              Email addresses
            </Label>
            <Textarea
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={4}
              placeholder="Enter email addresses separated by commas or new lines"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-neutral-700">
              Personal message (optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal message to your invitation"
              className="mt-2"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitations"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
