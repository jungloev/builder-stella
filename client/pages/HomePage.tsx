import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Calendar {
  id: string;
  name: string;
  displayName: string;
}

const AVAILABLE_CALENDARS: Calendar[] = [
  {
    id: "fastlandbox",
    name: "fastlandbox",
    displayName: "Fastland Box",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleSelectCalendar = (calendarId: string) => {
    navigate(`/thing=${calendarId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo Section */}
        <div className="flex justify-center">
          <img
            src="/icon.svg"
            alt="BookAThing Logo"
            className="h-24 w-24 object-contain"
          />
        </div>

        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            <p>Book a thing</p>
          </h1>
          <p className="text-slate-600">Select a calendar to view bookings</p>
        </div>

        {/* Calendar List Section */}
        <div className="space-y-3 pt-4">
          {AVAILABLE_CALENDARS.length > 0 ? (
            AVAILABLE_CALENDARS.map((calendar) => (
              <Button
                key={calendar.id}
                onClick={() => handleSelectCalendar(calendar.id)}
                variant="outline"
                className="w-full h-12 text-base hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {calendar.displayName}
              </Button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No calendars available yet.</p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-sm text-slate-500 pt-4">
          Each calendar is independently maintained and managed.
        </p>
      </div>
    </div>
  );
}
