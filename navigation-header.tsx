import { CalendarCheck, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NavigationHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CalendarCheck className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-medium text-neutral-900">GroupSync</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              My Groups
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/")}>
              Create Group
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <User className="text-white w-4 h-4" />
            </div>
          </nav>
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
