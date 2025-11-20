import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/BookingCalendar";
import { ChevronLeft } from "lucide-react";

const AVAILABLE_CALENDARS: Record<string, string> = {
  fastlandbox: "Fastland Box",
};

export default function CalendarPage() {
  const { calendarName } = useParams<{ calendarName: string }>();
  const navigate = useNavigate();

  if (!calendarName || !AVAILABLE_CALENDARS[calendarName]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Calendar Not Found
          </h1>
          <p className="text-slate-600">
            The calendar you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} variant="default">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black md:bg-white">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {AVAILABLE_CALENDARS[calendarName]}
          </h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-black md:bg-white">
        <BookingCalendar calendarId={calendarName} />
      </div>
    </div>
  );
}
