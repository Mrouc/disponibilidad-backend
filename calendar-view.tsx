import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Member, Availability, Group } from "@shared/schema";

interface CalendarViewProps {
  groupId: string;
  group: Group;
  members: Member[];
  availability: Availability[];
}

export default function CalendarView({ groupId, group, members, availability }: CalendarViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<string, string[]>>({});
  const currentMemberId = "demo-member"; // In a real app, get from auth
  const isTimeSlotsMode = group.availabilityMode === "time_slots";

  // Get current member's availability
  const currentMemberAvailability = availability.find(av => av.memberId === currentMemberId);
  if (currentMemberAvailability && selectedDates.size === 0) {
    setSelectedDates(new Set(currentMemberAvailability.selectedDates));
    if (isTimeSlotsMode && currentMemberAvailability.timeSlots) {
      setSelectedTimeSlots(currentMemberAvailability.timeSlots);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: { selectedDates: string[]; timeSlots?: Record<string, string[]> }) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/availability`, {
        memberId: currentMemberId,
        selectedDates: data.selectedDates,
        timeSlots: data.timeSlots || {},
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability saved!",
        description: "Your availability has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "availability"] });
    },
    onError: () => {
      toast({
        title: "Error saving availability",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateKey)) {
      newSelectedDates.delete(dateKey);
      // Also remove time slots for this date
      if (isTimeSlotsMode) {
        const newTimeSlots = { ...selectedTimeSlots };
        delete newTimeSlots[dateKey];
        setSelectedTimeSlots(newTimeSlots);
      }
    } else {
      newSelectedDates.add(dateKey);
      // Add default time slot for time slots mode
      if (isTimeSlotsMode) {
        setSelectedTimeSlots({
          ...selectedTimeSlots,
          [dateKey]: ["morning"] // Default to morning
        });
      }
    }
    
    setSelectedDates(newSelectedDates);
  };

  const toggleTimeSlot = (date: Date, timeSlot: "morning" | "evening") => {
    const dateKey = formatDateKey(date);
    const currentSlots = selectedTimeSlots[dateKey] || [];
    let newSlots;
    
    if (currentSlots.includes(timeSlot)) {
      newSlots = currentSlots.filter(slot => slot !== timeSlot);
    } else {
      newSlots = [...currentSlots, timeSlot];
    }
    
    setSelectedTimeSlots({
      ...selectedTimeSlots,
      [dateKey]: newSlots
    });
  };

  const getDateAvailability = (date: Date) => {
    const dateKey = formatDateKey(date);
    
    if (isTimeSlotsMode) {
      const morningCount = availability.filter(av => 
        av.timeSlots?.[dateKey]?.includes("morning")
      ).length;
      const eveningCount = availability.filter(av => 
        av.timeSlots?.[dateKey]?.includes("evening")
      ).length;
      
      return {
        available: Math.max(morningCount, eveningCount),
        total: members.length,
        isUserSelected: selectedDates.has(dateKey),
        morningCount,
        eveningCount,
        userTimeSlots: selectedTimeSlots[dateKey] || []
      };
    } else {
      const availableMembers = availability.filter(av => 
        av.selectedDates.includes(dateKey)
      ).length;
      
      return {
        available: availableMembers,
        total: members.length,
        isUserSelected: selectedDates.has(dateKey),
      };
    }
  };

  const getDateColor = (date: Date) => {
    const { available, total, isUserSelected } = getDateAvailability(date);
    
    if (isUserSelected) {
      return "bg-primary text-white";
    }
    
    if (available === 0) {
      return "text-neutral-900";
    } else if (available === total) {
      return "bg-green-500 text-white";
    } else if (available >= total * 0.6) {
      return "bg-orange-500 text-white";
    } else {
      return "bg-red-500 text-white";
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = getDaysInMonth(currentDate);
  const currentMonth = currentDate.getMonth();

  const handleSave = () => {
    if (isTimeSlotsMode) {
      saveMutation.mutate({
        selectedDates: Array.from(selectedDates),
        timeSlots: selectedTimeSlots
      });
    } else {
      saveMutation.mutate({
        selectedDates: Array.from(selectedDates)
      });
    }
  };

  const handleClearAll = () => {
    setSelectedDates(new Set());
    if (isTimeSlotsMode) {
      setSelectedTimeSlots({});
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-lg">Group Availability</CardTitle>
            <p className="text-sm text-neutral-600">
              {isTimeSlotsMode 
                ? "Select dates and time slots when you're available" 
                : "Select dates when you're available"
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h4 className="font-medium text-neutral-900 min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center space-x-6 mb-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-neutral-600">Everyone available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-neutral-600">Partially available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-neutral-600">Not available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-neutral-600">Your selection</span>
          </div>
          {isTimeSlotsMode && (
            <>
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="text-neutral-600">Morning</span>
              </div>
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-blue-500" />
                <span className="text-neutral-600">Evening</span>
              </div>
            </>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-neutral-600 py-3">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const dateAvailability = getDateAvailability(day);
            const dateKey = formatDateKey(day);
            
            return (
              <div key={index} className="flex flex-col">
                <button
                  onClick={() => isCurrentMonth && toggleDate(day)}
                  disabled={!isCurrentMonth}
                  className={`
                    h-12 w-full rounded-lg text-sm font-medium transition-all hover:shadow-md relative group mb-1
                    ${isCurrentMonth ? getDateColor(day) : 'text-neutral-300 cursor-not-allowed'}
                    ${isCurrentMonth ? 'hover:scale-105' : ''}
                  `}
                >
                  <span>{day.getDate()}</span>
                  {isCurrentMonth && dateAvailability.available > 0 && !isTimeSlotsMode && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="text-xs">
                        {selectedDates.has(dateKey) ? 'You' : `${dateAvailability.available}/${dateAvailability.total}`}
                      </div>
                    </div>
                  )}
                </button>
                
                {/* Time slot buttons for time slots mode */}
                {isTimeSlotsMode && isCurrentMonth && selectedDates.has(dateKey) && (
                  <div className="flex space-x-1 justify-center">
                    <button
                      onClick={() => toggleTimeSlot(day, "morning")}
                      className={`p-1 rounded text-xs transition-colors ${
                        dateAvailability.userTimeSlots?.includes("morning")
                          ? "bg-yellow-500 text-white"
                          : "bg-neutral-200 text-neutral-600 hover:bg-yellow-200"
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleTimeSlot(day, "evening")}
                      className={`p-1 rounded text-xs transition-colors ${
                        dateAvailability.userTimeSlots?.includes("evening")
                          ? "bg-blue-500 text-white"
                          : "bg-neutral-200 text-neutral-600 hover:bg-blue-200"
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {/* Availability counts for time slots mode */}
                {isTimeSlotsMode && isCurrentMonth && !selectedDates.has(dateKey) && (dateAvailability.morningCount! > 0 || dateAvailability.eveningCount! > 0) && (
                  <div className="flex space-x-1 justify-center">
                    {dateAvailability.morningCount! > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Sun className="w-2 h-2 mr-1" />
                        {dateAvailability.morningCount}
                      </Badge>
                    )}
                    {dateAvailability.eveningCount! > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Moon className="w-2 h-2 mr-1" />
                        {dateAvailability.eveningCount}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
          <div className="text-sm text-neutral-600">
            {isTimeSlotsMode 
              ? "Click dates to select, then choose morning/evening time slots."
              : "Click days to toggle your availability. Changes save automatically."
            }
          </div>
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={handleClearAll}>
              Clear All
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
