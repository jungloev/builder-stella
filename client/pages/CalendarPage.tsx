import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/BookingCalendar";

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
    <>
      <style>{`
        @media (min-width: 621px) {
          [data-calendar-page="true"] {
            background-color: rgba(216, 216, 216, 1);
          }
        }
      `}</style>
      <div
        className="flex flex-col min-h-screen bg-[#FDFDFB]"
        data-calendar-page="true"
      >
        <BookingCalendar
          calendarId={calendarName}
          calendarName={AVAILABLE_CALENDARS[calendarName]}
          onBack={() => navigate("/")}
        />
      </div>
    </>
  );
}
