import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { CreateBookingRequest } from "@shared/api";

// Add styles for range input and adaptive theming
const rangeSliderStyles = `
  input[type="range"] {
    pointer-events: auto;
    width: 100%;
    height: 32px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: none;
    cursor: grab;
    pointer-events: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    margin-top: -10px;
  }

  input[type="range"]::-webkit-slider-thumb:active {
    cursor: grabbing;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  input[type="range"]::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: none;
    cursor: grab;
    pointer-events: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    margin-top: -10px;
  }

  input[type="range"]::-moz-range-thumb:active {
    cursor: grabbing;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  input[type="range"]::-webkit-slider-runnable-track {
    appearance: none;
    background: transparent;
    height: 8px;
    border-radius: 4px;
    border: none;
  }

  input[type="range"]::-moz-range-track {
    background: transparent;
    border: none;
    height: 8px;
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="text"]::placeholder {
    color: rgba(156, 163, 175, 1);
  }

  @media (prefers-color-scheme: light) {
    input[type="text"]::placeholder {
      color: rgba(107, 114, 128, 0.7);
    }
  }

  @media (prefers-color-scheme: dark) {
    input[type="text"]::placeholder {
      color: rgba(156, 163, 175, 1);
    }
  }
`;

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onBookingCreated: () => void;
  existingBookings?: Array<{ id: string; startTime: string; endTime: string }>;
  calendarId?: string;
  requestClose?: boolean;
  onHeightChange?: (height: number) => void;
}

export function BookingDrawer({
  isOpen,
  onClose,
  currentDate,
  onBookingCreated,
  existingBookings = [],
  calendarId,
  requestClose = false,
  onHeightChange,
}: BookingDrawerProps) {
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [startTime, setStartTime] = useState(420); // 07:00 in minutes
  const [endTime, setEndTime] = useState(600); // 10:00 in minutes
  const [name, setName] = useState("");
  const [overlapError, setOverlapError] = useState("");
  const [activeInputZIndex, setActiveInputZIndex] = useState(5); // which input is on top
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Initialize to extremes when opening
      setStep(1);
      setStartTime(420); // 07:00
      setEndTime(1080); // 18:00
      setName("");
      setOverlapError("");
      setSubmitError("");
      setIsSubmitting(false);
      setActiveInputZIndex(5);
      setShouldAnimate(false);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
    } else {
      // Reset state after the close animation completes
      setTimeout(() => {
        setStep(1);
        setStartTime(420);
        setEndTime(1080);
        setName("");
        setOverlapError("");
        setSubmitError("");
        setIsSubmitting(false);
        setShouldAnimate(false);
      }, 200);
    }
  }, [isOpen]);

  // Measure drawer panel height when it becomes visible and notify parent
  useEffect(() => {
    if (shouldAnimate && isOpen && drawerPanelRef.current) {
      // Wait one frame to ensure layout is updated
      requestAnimationFrame(() => {
        const h = drawerPanelRef.current ? drawerPanelRef.current.offsetHeight : 0;
        if (onHeightChange) onHeightChange(h + 16); // include small offset
      });
    }

    // When starting to animate out, notify to collapse button
    if (isAnimatingOut && onHeightChange) {
      onHeightChange(0);
    }
  }, [shouldAnimate, isOpen, isAnimatingOut, onHeightChange]);

  // If parent requests the drawer to close (e.g., add button acting as cancel), trigger the close animation
  useEffect(() => {
    if (requestClose && isOpen) {
      handleCancel();
    }
  }, [requestClose, isOpen]);

  // Handle keyboard shortcuts and mobile keyboard avoidance
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close drawer
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
      // Enter to submit
      if (e.key === "Enter") {
        e.preventDefault();
        if (step === 1) {
          handleNext();
        } else {
          handleBookIt();
        }
      }
    };

    // Handle mobile keyboard appearance
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        // Scroll the focused input into view with some delay to account for keyboard animation
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [isOpen, step, name, startTime, endTime]);

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const timeToMinutes = (timeStr: string) => {
    const [hours, mins] = timeStr.split(":").map(Number);
    return hours * 60 + mins;
  };

  const checkOverlap = (newStart: number, newEnd: number): boolean => {
    return existingBookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      // Check if ranges overlap
      return !(newEnd <= bookingStart || newStart >= bookingEnd);
    });
  };

  const handleNext = () => {
    if (checkOverlap(startTime, endTime)) {
      setOverlapError(
        `Time slot from ${minutesToTime(startTime)} to ${minutesToTime(endTime)} is already booked. Please select a different time.`,
      );
      return;
    }
    setOverlapError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 200);
  };

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    // Get the slider container position
    const rect = e.currentTarget.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const percentage = pointerX / rect.width;
    const pointerValue = 420 + percentage * (1080 - 420);

    // Determine which knob is closer
    const distToStart = Math.abs(pointerValue - startTime);
    const distToEnd = Math.abs(pointerValue - endTime);

    // Set z-index based on which is closer
    setActiveInputZIndex(distToStart <= distToEnd ? 5 : 4);
  };

  const handleBookIt = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const booking: CreateBookingRequest = {
        name: name.trim(),
        startTime: minutesToTime(startTime),
        endTime: minutesToTime(endTime),
        date: currentDate,
      };

      const calendarParam = calendarId
        ? `?calendar=${encodeURIComponent(calendarId)}`
        : "";
      const response = await fetch(`/api/bookings${calendarParam}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      });

      if (response.ok) {
        setIsAnimatingOut(true);
        setTimeout(() => {
          onBookingCreated();
          setIsAnimatingOut(false);
        }, 200);
      } else {
        const errorData = await response.json();
        setSubmitError(
          errorData.error || `Failed to create booking (${response.status})`,
        );
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isAnimatingOut) return null;

  return (
    <>
      <style>{rangeSliderStyles}</style>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 ${isAnimatingOut || (isOpen && !shouldAnimate) ? "opacity-0" : "opacity-100"}`}
        onClick={onClose}
        style={{
          transition: `opacity 200ms ${isAnimatingOut ? "ease-in" : "ease-out"}`,
          pointerEvents: shouldAnimate && !isAnimatingOut ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 ${isAnimatingOut || (isOpen && !shouldAnimate) ? "translate-y-full" : "translate-y-0"}`}
        style={{
          transition: `transform 200ms ${isAnimatingOut ? "ease-in" : "ease-out"}`,
        }}
      >
        <div
          ref={drawerPanelRef}
          className="max-w-[390px] mx-auto rounded-t-2xl p-6 flex flex-col gap-4 shadow-lg max-h-[90dvh] overflow-y-auto"
          style={{
            backgroundColor: "var(--drawer-bg)",
          }}
        >
          {step === 1 ? (
            <>
              {/* Duration Step */}
              <div className="flex flex-col gap-3">
                {/* Label */}
                <div className="flex justify-between items-start">
                  <span
                    className="text-base font-inter"
                    style={{ color: "var(--drawer-text)" }}
                  >
                    Set start and stop
                  </span>
                </div>

                {/* Dual Range Slider */}
                <div
                  className="relative flex items-center justify-center py-2"
                  onPointerMove={handleSliderPointerMove}
                >
                  {/* Background track */}
                  <div className="absolute left-0 right-0 h-2 bg-[#E6E6E6] rounded-full"></div>

                  {/* Active green track */}
                  <div
                    className="absolute h-2 bg-[#14AE5C] rounded-full"
                    style={{
                      left: `${((startTime - 420) / (1080 - 420)) * 100}%`,
                      right: `${100 - ((endTime - 420) / (1080 - 420)) * 100}%`,
                    }}
                  ></div>

                  {/* Start input */}
                  <input
                    type="range"
                    min={420}
                    max={1080}
                    step={15}
                    value={startTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < endTime - 15) {
                        setStartTime(val);
                        setOverlapError("");
                      }
                    }}
                    className="absolute w-full h-full cursor-pointer appearance-none bg-transparent"
                    style={{
                      zIndex: activeInputZIndex === 5 ? 5 : 3,
                    }}
                  />

                  {/* End input */}
                  <input
                    type="range"
                    min={420}
                    max={1080}
                    step={15}
                    value={endTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > startTime + 15) {
                        setEndTime(val);
                        setOverlapError("");
                      }
                    }}
                    className="absolute w-full h-full cursor-pointer appearance-none bg-transparent"
                    style={{
                      zIndex: activeInputZIndex === 4 ? 5 : 4,
                    }}
                  />
                </div>

                {/* Description */}
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="font-inter"
                    style={{ color: "var(--drawer-text-secondary)" }}
                  >
                    {minutesToTime(startTime)} — {minutesToTime(endTime)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {overlapError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm font-inter flex items-start justify-between gap-2">
                  <span className="flex-1">{overlapError}</span>
                  <button
                    onClick={() => setOverlapError("")}
                    className="text-red-700 hover:text-red-900 flex-shrink-0 font-bold"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-3 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: "var(--drawer-bg)",
                    borderColor: "var(--drawer-border)",
                    color: "var(--drawer-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <X
                    className="w-4 h-4"
                    strokeWidth={1.6}
                    style={{ color: "var(--drawer-text)" }}
                  />
                  <span className="text-base font-inter">Cancel</span>
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-3 py-3 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: "#F5F5F5",
                    borderColor: "#2C2C2C",
                    color: "#1E1E1E",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <span className="text-base font-inter">Next</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Name Step */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-base font-inter"
                  style={{ color: "var(--drawer-text)" }}
                >
                  Your name
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="px-4 py-3 border rounded-lg text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#14AE5C]"
                  style={{
                    backgroundColor: "var(--drawer-input-bg)",
                    borderColor: "var(--drawer-border)",
                    color: "var(--drawer-text)",
                  }}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm font-inter flex items-start justify-between gap-2">
                  <span className="flex-1">{submitError}</span>
                  <button
                    onClick={() => setSubmitError("")}
                    className="text-red-700 hover:text-red-900 flex-shrink-0 font-bold"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--drawer-bg)",
                    borderColor: "var(--drawer-border)",
                    color: "var(--drawer-text)",
                  }}
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.6} />
                  <span className="text-base font-inter">Back</span>
                </button>

                <button
                  onClick={handleBookIt}
                  disabled={!name.trim() || isSubmitting}
                  className="flex items-center gap-2 px-3 py-3 border border-[#14AE5C] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#14AE5C",
                    color: "white",
                  }}
                >
                  <span className="text-base font-inter">
                    {isSubmitting ? "Creating..." : "Book it"}
                  </span>
                  <Zap className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
