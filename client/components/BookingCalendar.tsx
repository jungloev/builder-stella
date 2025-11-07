import { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { Booking } from "@shared/api";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BookingDrawer } from "./BookingDrawer";
import { BookingDetailsDialog } from "./BookingDetailsDialog";

interface BookingCalendarProps {
  initialDate?: Date;
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export function BookingCalendar({ initialDate = new Date() }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const dateString = format(currentDate, "yyyy-MM-dd");

  // Fetch bookings for current date
  useEffect(() => {
    fetchBookings();
  }, [dateString]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings?date=${dateString}`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const handleDateClick = () => {
    const today = new Date();
    if (format(currentDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")) {
      setCurrentDate(today);
    }
  };

  const handleBookingCreated = () => {
    setIsDrawerOpen(false);
    fetchBookings();
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsDialogOpen(true);
  };

  const handleBookingDeleted = () => {
    setSelectedBooking(null);
    fetchBookings();
  };

  // Calculate booking positions
  // 42px gap + ~16px for time slot div height = 58px per hour
  const PIXELS_PER_HOUR = 58;
  const TOP_OFFSET = 8; // 8px offset adjustment
  const bookingElements = useMemo(() => {
    return bookings.map(booking => {
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;

      // Position from 07:00 in minutes
      const offsetMinutes = startMinutes - (7 * 60);

      // Convert minutes to pixels
      const topPixels = (offsetMinutes / 60) * PIXELS_PER_HOUR + TOP_OFFSET;
      const heightPixels = (duration / 60) * PIXELS_PER_HOUR;

      return {
        ...booking,
        topPixels,
        heightPixels
      };
    });
  }, [bookings]);

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col max-w-[390px] mx-auto relative">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between px-0 py-4 sticky top-0 bg-[#FDFDFB] z-10">
        <button
          onClick={handlePreviousDay}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={handleDateClick}
          className="font-sans text-[36px] leading-[44px] font-bold text-[#0C0B0C] text-center flex-1 hover:opacity-70 transition-opacity cursor-pointer"
        >
          {format(currentDate, "EEE, d MMM")}
        </button>

        <button
          onClick={handleNextDay}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 px-[10px] pb-24 relative">
        {/* Time slots */}
        <div className="flex flex-col gap-[42px]">
          {TIME_SLOTS.map((time, index) => (
            <div key={time} className="flex items-center gap-2 py-[2px]">
              <span className="text-[11px] font-medium text-black opacity-50 font-inter leading-3">
                {time}
              </span>
              <div className="flex-1 h-[1px] bg-black opacity-5"></div>
            </div>
          ))}
        </div>

        {/* Bookings overlay */}
        {!isLoading && bookingElements.length > 0 && (
          <div className="absolute top-0 left-[10px] right-[10px] pointer-events-none" style={{ height: `${(TIME_SLOTS.length - 1) * 42}px`, zIndex: 5 }}>
            {bookingElements.map(booking => (
              <div
                key={booking.id}
                className="absolute left-0 right-0 pointer-events-auto"
                style={{
                  top: `${booking.topPixels}px`,
                  height: `${booking.heightPixels}px`,
                  marginLeft: '36px',
                  marginRight: '10px',
                }}
              >
                <button
                  onClick={() => handleBookingClick(booking)}
                  className="w-full h-full bg-white border border-[#868686] rounded-lg p-1.5 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <span className="text-black text-sm font-medium font-roboto leading-5 tracking-[0.1px]">
                    {booking.startTime}–{booking.endTime}
                  </span>
                  <span className="text-black text-sm font-medium font-roboto leading-5 tracking-[0.1px]">
                    {booking.name}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[58px] h-[58px] bg-[#2C2C2C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#3C3C3C] transition-colors z-20"
        aria-label="Add booking"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2} />
      </button>

      {/* Booking Drawer */}
      <BookingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentDate={dateString}
        onBookingCreated={handleBookingCreated}
        existingBookings={bookings}
      />

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        booking={selectedBooking}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onDeleted={handleBookingDeleted}
      />
    </div>
  );
}
