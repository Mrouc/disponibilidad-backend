import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon } from "lucide-react";
import type { Member, Availability, Group } from "@shared/schema";

interface BestDatesSectionProps {
  group: Group;
  members: Member[];
  availability: Availability[];
}

interface DateAvailability {
  date: string;
  available: number;
  total: number;
  percentage: number;
  morningCount?: number;
  eveningCount?: number;
  timeSlot?: "morning" | "evening" | "both";
}

export default function BestDatesSection({ group, members, availability }: BestDatesSectionProps) {
  const isTimeSlotsMode = group.availabilityMode === "time_slots";

  const getBestDates = (): DateAvailability[] => {
    if (isTimeSlotsMode) {
      const timeSlotsMap = new Map<string, { morning: number; evening: number }>();
      
      // Count time slot availability for each date
      availability.forEach(av => {
        if (av.timeSlots) {
          Object.entries(av.timeSlots).forEach(([date, slots]) => {
            if (!timeSlotsMap.has(date)) {
              timeSlotsMap.set(date, { morning: 0, evening: 0 });
            }
            const counts = timeSlotsMap.get(date)!;
            if (slots.includes("morning")) counts.morning++;
            if (slots.includes("evening")) counts.evening++;
          });
        }
      });

      const dateAvailability: DateAvailability[] = [];
      
      // Create entries for each time slot
      timeSlotsMap.forEach(({ morning, evening }, date) => {
        if (morning > 0) {
          dateAvailability.push({
            date,
            available: morning,
            total: members.length,
            percentage: members.length > 0 ? (morning / members.length) * 100 : 0,
            morningCount: morning,
            eveningCount: evening,
            timeSlot: "morning"
          });
        }
        if (evening > 0) {
          dateAvailability.push({
            date,
            available: evening,
            total: members.length,
            percentage: members.length > 0 ? (evening / members.length) * 100 : 0,
            morningCount: morning,
            eveningCount: evening,
            timeSlot: "evening"
          });
        }
      });

      return dateAvailability
        .sort((a, b) => b.percentage - a.percentage || b.available - a.available)
        .slice(0, 12); // Show more for time slots
    } else {
      const dateMap = new Map<string, number>();
      
      // Count availability for each date
      availability.forEach(av => {
        av.selectedDates.forEach(date => {
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        });
      });

      // Convert to array and sort by availability
      const dateAvailability: DateAvailability[] = Array.from(dateMap.entries())
        .map(([date, available]) => ({
          date,
          available,
          total: members.length,
          percentage: members.length > 0 ? (available / members.length) * 100 : 0,
        }))
        .filter(item => item.available > 0)
        .sort((a, b) => b.percentage - a.percentage || b.available - a.available)
        .slice(0, 8); // Show top 8 dates

      return dateAvailability;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage === 100) {
      return <Badge className="bg-green-500 text-white">Perfect</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-green-400 text-white">Excellent</Badge>;
    } else if (percentage >= 60) {
      return <Badge className="bg-orange-500 text-white">Good</Badge>;
    } else {
      return <Badge className="bg-orange-300 text-white">Fair</Badge>;
    }
  };

  const getBorderColor = (percentage: number) => {
    if (percentage === 100) {
      return "border-green-500 bg-green-50";
    } else if (percentage >= 80) {
      return "border-green-400 bg-green-50";
    } else if (percentage >= 60) {
      return "border-orange-500 bg-orange-50";
    } else {
      return "border-orange-300 bg-orange-50";
    }
  };

  const bestDates = getBestDates();

  if (bestDates.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Best Available Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 text-center py-8">
            No dates with member availability yet. Members can start selecting their available dates to see the best options here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Best Available Dates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bestDates.map((dateInfo, index) => (
            <div
              key={`${dateInfo.date}-${dateInfo.timeSlot || 'full'}-${index}`}
              className={`p-4 border rounded-lg ${getBorderColor(dateInfo.percentage)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-neutral-900">
                    {formatDate(dateInfo.date)}
                  </span>
                  {isTimeSlotsMode && dateInfo.timeSlot && (
                    <div className="flex items-center">
                      {dateInfo.timeSlot === "morning" && <Sun className="w-4 h-4 text-yellow-500" />}
                      {dateInfo.timeSlot === "evening" && <Moon className="w-4 h-4 text-blue-500" />}
                    </div>
                  )}
                </div>
                {getStatusBadge(dateInfo.percentage)}
              </div>
              <p className="text-sm text-neutral-600">
                {dateInfo.available} of {dateInfo.total} members available
                {isTimeSlotsMode && dateInfo.timeSlot && (
                  <span className="text-neutral-500 ml-1">
                    ({dateInfo.timeSlot})
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
