import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import GroupHeader from "@/components/group-header";
import MembersList from "@/components/members-list";
import CalendarView from "@/components/calendar-view";
import BestDatesSection from "@/components/best-dates-section";
import InviteMemberModal from "@/components/invite-member-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Group, Member, Availability } from "@shared/schema";
import { useWebSocket } from "@/lib/websocket";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export default function Group() {
  const { id } = useParams();
  const groupId = id === "demo" ? getDemoGroupId() : id;

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/groups", groupId, "members"],
    enabled: !!groupId,
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery<Availability[]>({
    queryKey: ["/api/groups", groupId, "availability"],
    enabled: !!groupId,
  });

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket(groupId || null);

  useEffect(() => {
    if (lastMessage?.type === "availability_updated") {
      // Invalidate availability queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "availability"] });
    }
  }, [lastMessage, groupId]);

  if (groupLoading || membersLoading || availabilityLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Group Not Found</h2>
              <p className="text-neutral-600">The group you're looking for doesn't exist or has been deleted.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupHeader group={group} memberCount={members.length} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <MembersList 
              members={members} 
              availability={availability}
              groupId={groupId!}
            />
          </div>
          
          <div className="lg:col-span-3">
            <CalendarView 
              groupId={groupId!}
              group={group}
              members={members}
              availability={availability}
            />
          </div>
        </div>

        <BestDatesSection 
          group={group}
          members={members}
          availability={availability}
        />
      </main>

      <InviteMemberModal groupId={groupId!} />
    </div>
  );
}

// Helper function to get demo group ID
function getDemoGroupId(): string {
  return "550e8400-e29b-41d4-a716-446655440000"; // Fixed demo group ID
}
