import { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  addDays,
  subDays,
  parseISO,
  getDaysInMonth,
  getMonth,
  getYear,
  startOfMonth,
} from "date-fns";
import { Booking } from "@shared/api";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BookingDrawer } from "./BookingDrawer";
import { BookingDetailsDialog } from "./BookingDetailsDialog";

const AVAILABLE_CALENDARS: Record<string, string> = {
  fastlandbox: "Fastland Box",
};

const bookingStyles = `
  @keyframes fadeInBooking {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .booking-item {
    animation: fadeInBooking 200ms linear;
  }

  @keyframes fadeInModal {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOutModal {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .date-picker-backdrop {
    animation: fadeInModal 50ms linear;
  }

  .date-picker-backdrop.closing {
    animation: fadeOutModal 50ms linear;
  }

  .date-picker-card {
    animation: fadeInModal 50ms linear;
  }

  .date-picker-card.closing {
    animation: fadeOutModal 50ms linear;
  }

`;

interface BookingCalendarProps {
  initialDate?: Date;
  calendarId?: string;
}

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function BookingCalendar({
  initialDate = new Date(),
  calendarId,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [fadingOutBookingIds, setFadingOutBookingIds] = useState<Set<string>>(
    new Set(),
  );
  const [newlyCreatedBookingIds, setNewlyCreatedBookingIds] = useState<
    Set<string>
  >(new Set());
  const [bookingCache] = useState(new Map<string, Booking[]>()); // Cache for bookings by date
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDatePickerClosing, setIsDatePickerClosing] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [monthBookingsLoaded, setMonthBookingsLoaded] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const SWIPE_THRESHOLD = 120;
  const LONG_PRESS_DURATION = 200;

  const dateString = format(currentDate, "yyyy-MM-dd");

  // Fetch bookings for current date and preload adjacent dates
  useEffect(() => {
    fetchBookings();
    // Defer adjacent date preloading until browser is idle
    if ("requestIdleCallback" in window) {
      const callbackId = requestIdleCallback(() => preloadAdjacentDates());
      return () => cancelIdleCallback(callbackId);
    } else {
      const timer = setTimeout(() => {
        preloadAdjacentDates();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dateString]);

  const fetchBookings = async (isAfterCreation = false, date?: string) => {
    const targetDate = date || dateString;

    // Check cache first
    if (bookingCache.has(targetDate) && !isAfterCreation) {
      const cached = bookingCache.get(targetDate) || [];
      setBookings(cached);
      setIsLoading(false);
      // Refresh in background
      const calendarParam = calendarId
        ? `&calendar=${encodeURIComponent(calendarId)}`
        : "";
      fetch(`/api/bookings?date=${targetDate}${calendarParam}`)
        .then((res) => res.json())
        .then((data) => {
          bookingCache.set(targetDate, data.bookings || []);
          if (targetDate === dateString) {
            setBookings(data.bookings || []);
          }
        })
        .catch((err) => console.error("Error refreshing bookings:", err));
      return;
    }

    try {
      setIsLoading(true);
      const calendarParam = calendarId
        ? `&calendar=${encodeURIComponent(calendarId)}`
        : "";
      const response = await fetch(
        `/api/bookings?date=${targetDate}${calendarParam}`,
      );
      const data = await response.json();
      const bookingList = data.bookings || [];

      bookingCache.set(targetDate, bookingList);

      if (targetDate === dateString) {
        setBookings(bookingList);
      }

      // If this fetch is after booking creation, identify newly created bookings
      if (isAfterCreation) {
        const now = Date.now();
        const newly = new Set(
          bookingList
            .filter((b: Booking) => {
              // Extract timestamp from ID (format: "timestamp-randomstring")
              const idTimestamp = parseInt(b.id.split("-")[0], 10);
              // Consider bookings created in the last 5 seconds as "newly created"
              return now - idTimestamp < 5000;
            })
            .map((b: Booking) => b.id),
        );
        setNewlyCreatedBookingIds(newly);
      } else {
        setNewlyCreatedBookingIds(new Set()); // Clear when navigating
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      if (targetDate === dateString) {
        setIsLoading(false);
      }
    }
  };

  const preloadAdjacentDates = () => {
    const nextDate = format(addDays(currentDate, 1), "yyyy-MM-dd");
    const prevDate = format(subDays(currentDate, 1), "yyyy-MM-dd");

    // Preload next and previous dates if not cached
    if (!bookingCache.has(nextDate)) {
      const calendarParam = calendarId
        ? `&calendar=${encodeURIComponent(calendarId)}`
        : "";
      fetch(`/api/bookings?date=${nextDate}${calendarParam}`)
        .then((res) => res.json())
        .then((data) => bookingCache.set(nextDate, data.bookings || []))
        .catch((err) => console.error("Error preloading next date:", err));
    }

    if (!bookingCache.has(prevDate)) {
      const calendarParam = calendarId
        ? `&calendar=${encodeURIComponent(calendarId)}`
        : "";
      fetch(`/api/bookings?date=${prevDate}${calendarParam}`)
        .then((res) => res.json())
        .then((data) => bookingCache.set(prevDate, data.bookings || []))
        .catch((err) => console.error("Error preloading prev date:", err));
    }
  };

  const handlePreviousDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (isDrawerOpen) {
      return;
    }

    const difference = touchStartX.current - touchEndX.current;
    const isLeftSwipe = difference > SWIPE_THRESHOLD;
    const isRightSwipe = difference < -SWIPE_THRESHOLD;

    if (isLeftSwipe) {
      handleNextDay();
    } else if (isRightSwipe) {
      handlePreviousDay();
    }
  };

  const preloadMonthBookings = async (month: Date) => {
    const year = getYear(month);
    const monthIndex = getMonth(month);
    const daysInMonth = getDaysInMonth(month);

    const datesToFetch: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(year, monthIndex, day), "yyyy-MM-dd");
      if (!bookingCache.has(dateStr)) {
        datesToFetch.push(dateStr);
      }
    }

    if (datesToFetch.length > 0) {
      const fetchPromises = datesToFetch.map(async (dateStr) => {
        try {
          const calendarParam = calendarId
            ? `&calendar=${encodeURIComponent(calendarId)}`
            : "";
          const res = await fetch(
            `/api/bookings?date=${dateStr}${calendarParam}`,
          );
          const data = await res.json();
          bookingCache.set(dateStr, data.bookings || []);
        } catch (err) {
          console.error(`Error fetching bookings for ${dateStr}:`, err);
        }
      });

      await Promise.all(fetchPromises);
    }

    setMonthBookingsLoaded((prev) => !prev);
  };

  const handleDateClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    setIsDatePickerOpen(true);
    setPickerMonth(currentDate);
    preloadMonthBookings(currentDate);
  };

  const handleDateMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      const today = new Date();
      setCurrentDate(today);
    }, LONG_PRESS_DURATION);
  };

  const handleDateMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDateTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      const today = new Date();
      setCurrentDate(today);
    }, LONG_PRESS_DURATION);
  };

  const handleDateTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      getYear(pickerMonth),
      getMonth(pickerMonth),
      day,
    );
    setCurrentDate(selectedDate);
    handleCloseDatePicker();
  };

  const handlePickerPrevMonth = () => {
    const newMonth = subDays(startOfMonth(pickerMonth), 1);
    setPickerMonth(newMonth);
    preloadMonthBookings(newMonth);
  };

  const handlePickerNextMonth = () => {
    const newMonth = addDays(startOfMonth(pickerMonth), 32);
    setPickerMonth(newMonth);
    preloadMonthBookings(newMonth);
  };

  const handleCloseDatePicker = () => {
    setIsDatePickerClosing(true);
    setTimeout(() => {
      setIsDatePickerOpen(false);
      setIsDatePickerClosing(false);
    }, 50);
  };

  const hasBookingsOnDate = (day: number): boolean => {
    const dateStr = format(
      new Date(getYear(pickerMonth), getMonth(pickerMonth), day),
      "yyyy-MM-dd",
    );
    const bookings = bookingCache.get(dateStr);
    return bookings ? bookings.length > 0 : false;
  };

  const handleBookingCreated = () => {
    setIsDrawerOpen(false);
    fetchBookings(true); // Pass true to flag this as a post-creation fetch
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsDialogOpen(true);
  };

  const handleBookingDeleted = () => {
    if (selectedBooking) {
      // Add to fading set
      setFadingOutBookingIds((prev) => new Set(prev).add(selectedBooking.id));

      // Remove after fade animation completes
      setTimeout(() => {
        setSelectedBooking(null);
        fetchBookings(false);
        setFadingOutBookingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedBooking.id);
          return newSet;
        });
      }, 200);
    }
  };

  // Calculate booking positions
  // 42px gap + ~16px for time slot div height = 58px per hour
  const PIXELS_PER_HOUR = 58;
  const TOP_OFFSET = 8; // 8px offset adjustment
  const bookingElements = useMemo(() => {
    return bookings.map((booking) => {
      const [startHour, startMin] = booking.startTime.split(":").map(Number);
      const [endHour, endMin] = booking.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;

      // Position from 07:00 in minutes
      const offsetMinutes = startMinutes - 7 * 60;

      // Convert minutes to pixels
      const topPixels = (offsetMinutes / 60) * PIXELS_PER_HOUR + TOP_OFFSET;
      const heightPixels = (duration / 60) * PIXELS_PER_HOUR;

      return {
        ...booking,
        topPixels,
        heightPixels,
      };
    });
  }, [bookings]);

  return (
    <div
      data-booking-calendar
      className="min-h-screen bg-[#FDFDFB] flex flex-col max-w-[390px] mx-auto relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{bookingStyles}</style>
      {/* Header with date navigation */}
      <div
        data-booking-calendar-header
        className="flex items-center justify-center px-0 py-4 sticky top-0 bg-[#FDFDFB] z-10"
      >
        <button
          onClick={handleDateClick}
          onMouseDown={handleDateMouseDown}
          onMouseUp={handleDateMouseUp}
          onMouseLeave={handleDateMouseUp}
          onTouchStart={handleDateTouchStart}
          onTouchEnd={handleDateTouchEnd}
          className="font-sans text-[36px] leading-[44px] font-bold text-[#0C0B0C] text-center hover:opacity-70 transition-opacity cursor-pointer"
        >
          {format(currentDate, "EEE, d MMM")}
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
          <div
            className="absolute top-0 left-[10px] right-[10px] pointer-events-none"
            style={{ height: `${(TIME_SLOTS.length - 1) * 42}px`, zIndex: 5 }}
          >
            {bookingElements.map((booking) => (
              <div
                key={booking.id}
                className={`absolute left-0 right-0 pointer-events-auto ${newlyCreatedBookingIds.has(booking.id) ? "booking-item" : ""}`}
                style={{
                  top: `${booking.topPixels}px`,
                  height: `${booking.heightPixels}px`,
                  marginLeft: "36px",
                  marginRight: "10px",
                  opacity: fadingOutBookingIds.has(booking.id) ? 0 : 1,
                  transition: "opacity 200ms linear",
                }}
              >
                <button
                  onClick={() => handleBookingClick(booking)}
                  className="w-full h-full bg-white border border-[#868686] rounded-lg p-1.5 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <span className="text-black text-sm font-medium font-roboto leading-5 tracking-[0.1px]">
                    {booking.startTime} – {booking.endTime}
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
        className="fixed left-1/2 -translate-x-1/2 w-[58px] h-[58px] bg-[#2C2C2C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#3C3C3C] transition-colors z-20"
        style={{ bottom: "calc(4rem - 5px)" }}
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
        calendarId={calendarId}
      />

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        booking={selectedBooking}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onDeleted={handleBookingDeleted}
        calendarId={calendarId}
      />

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-24 z-40 date-picker-backdrop ${isDatePickerClosing ? "closing" : ""}`}
          onClick={handleCloseDatePicker}
        >
          <div
            className={`w-full max-w-[390px] flex flex-col px-4 date-picker-card ${isDatePickerClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white border border-[#868686] shadow-md p-6"
              style={{ borderRadius: "19.2px" }}
            >
              {/* Month Navigation */}
              <div
                className="flex items-center justify-between mb-6"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                <button
                  onClick={handlePickerPrevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-lg font-semibold text-[#0C0B0C] user-select-none">
                  {format(pickerMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={handlePickerNextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Date Grid */}
              <div
                className="grid grid-cols-7 gap-2"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
                {Array.from({
                  length:
                    ((startOfMonth(pickerMonth).getDay() + 6) % 7) +
                    getDaysInMonth(pickerMonth),
                }).map((_, index) => {
                  const dayOfMonth =
                    index - ((startOfMonth(pickerMonth).getDay() + 6) % 7) + 1;
                  const isValidDate = dayOfMonth > 0;

                  if (!isValidDate) {
                    return (
                      <div key={`empty-${index}`} className="aspect-square" />
                    );
                  }

                  const today = new Date();
                  const isCurrentDay =
                    dayOfMonth === currentDate.getDate() &&
                    getMonth(pickerMonth) === getMonth(currentDate) &&
                    getYear(pickerMonth) === getYear(currentDate);
                  const isToday =
                    dayOfMonth === today.getDate() &&
                    getMonth(pickerMonth) === getMonth(today) &&
                    getYear(pickerMonth) === getYear(today);
                  const hasBookings = hasBookingsOnDate(dayOfMonth);

                  return (
                    <button
                      key={dayOfMonth}
                      onClick={() => handleDateSelect(dayOfMonth)}
                      className={`aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors relative ${
                        isCurrentDay
                          ? "bg-[#2C2C2C] text-white"
                          : isToday
                            ? "border-2 border-[#2C2C2C] text-[#0C0B0C]"
                            : "text-[#0C0B0C] hover:bg-gray-100"
                      }`}
                    >
                      {dayOfMonth}
                      {hasBookings && (
                        <div
                          className="absolute w-1.5 h-1.5 rounded-full bg-[#B4A8E0]"
                          style={{ bottom: "-1px" }}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
