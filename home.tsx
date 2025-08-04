import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarCheck, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertGroup } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    createdBy: "demo-user", // In a real app, this would come from auth
    availabilityMode: "full_day" as "full_day" | "time_slots",
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: InsertGroup) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return response.json();
    },
    onSuccess: (group) => {
      toast({
        title: "Group created successfully!",
        description: "Your group has been created and you can now invite members.",
      });
      setLocation(`/group/${group.id}`);
    },
    onError: () => {
      toast({
        title: "Error creating group",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group.",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(formData);
  };

  const handleDemoGroup = () => {
    // Navigate to demo group
    setLocation("/group/demo");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarCheck className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-medium text-neutral-900">GroupSync</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Find the Perfect Time for Everyone
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Create a group, invite members, and discover when everyone is available.
            No more endless email chains or scheduling conflicts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create & Invite</h3>
            <p className="text-neutral-600">
              Create your group and invite members via email. They'll get instant access to your scheduling page.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select Dates</h3>
            <p className="text-neutral-600">
              Each member selects their available dates on an easy-to-use calendar interface.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Best Times</h3>
            <p className="text-neutral-600">
              See at a glance when everyone is available and pick the perfect time for your event.
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Team Building Weekend"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your event or meeting"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Availability Mode</Label>
                  <RadioGroup 
                    value={formData.availabilityMode} 
                    onValueChange={(value) => setFormData({ ...formData, availabilityMode: value as "full_day" | "time_slots" })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full_day" id="full_day" />
                      <Label htmlFor="full_day" className="font-normal">
                        Full Day - Members select available dates
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="time_slots" id="time_slots" />
                      <Label htmlFor="time_slots" className="font-normal">
                        Time Slots - Members can select morning, evening, or both
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createGroupMutation.isPending}
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </form>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDemoGroup}
                >
                  View Demo Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
