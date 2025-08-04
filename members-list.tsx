import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, HourglassIcon } from "lucide-react";
import type { Member, Availability } from "@shared/schema";

interface MembersListProps {
  members: Member[];
  availability: Availability[];
  groupId: string;
}

export default function MembersList({ members, availability }: MembersListProps) {
  const getAvailabilityStatus = (memberId: string) => {
    const memberAvailability = availability.find(av => av.memberId === memberId);
    if (!memberAvailability) {
      return { status: 'pending', count: 0 };
    }
    
    const count = memberAvailability.selectedDates.length;
    if (count === 0) {
      return { status: 'pending', count: 0 };
    } else if (count < 5) {
      return { status: 'partial', count };
    } else {
      return { status: 'complete', count };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'partial':
        return 'bg-orange-500';
      default:
        return 'bg-neutral-400';
    }
  };

  const responsesCount = availability.filter(av => av.selectedDates.length > 0).length;
  const responseRate = members.length > 0 ? (responsesCount / members.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Members</CardTitle>
          <span className="text-sm text-neutral-600">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const availabilityStatus = getAvailabilityStatus(member.id);
            
            return (
              <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(availabilityStatus.status)}`}>
                  <span className="text-white text-sm font-medium">
                    {getInitials(member.name)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{member.name}</p>
                  <div className="flex items-center text-sm">
                    {availabilityStatus.status === 'complete' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-600">Available selected</span>
                      </>
                    )}
                    {availabilityStatus.status === 'partial' && (
                      <>
                        <Clock className="w-4 h-4 text-orange-500 mr-1" />
                        <span className="text-orange-600">Partially available</span>
                      </>
                    )}
                    {availabilityStatus.status === 'pending' && (
                      <>
                        <HourglassIcon className="w-4 h-4 text-neutral-500 mr-1" />
                        <span className="text-neutral-600">Pending response</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Responses</span>
              <span className="font-medium">{responsesCount}/{members.length}</span>
            </div>
            <Progress value={responseRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
