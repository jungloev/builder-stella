import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { CreateBookingRequest } from "@shared/api";

// Add styles for range input
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
`;

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onBookingCreated: () => void;
  existingBookings?: Array<{ id: string; startTime: string; endTime: string }>;
}

export function BookingDrawer({
  isOpen,
  onClose,
  currentDate,
  onBookingCreated,
  existingBookings = []
}: BookingDrawerProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [startTime, setStartTime] = useState(420); // 07:00 in minutes
  const [endTime, setEndTime] = useState(600); // 10:00 in minutes
  const [name, setName] = useState("");
  const [overlapError, setOverlapError] = useState("");
  const [activeInputZIndex, setActiveInputZIndex] = useState(5); // which input is on top

  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setTimeout(() => {
        setStep(1);
        setStartTime(420);
        setEndTime(600);
        setName("");
        setOverlapError("");
      }, 300);
    }
  }, [isOpen]);

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (timeStr: string) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
  };

  const checkOverlap = (newStart: number, newEnd: number): boolean => {
    return existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      // Check if ranges overlap
      return !(newEnd <= bookingStart || newStart >= bookingEnd);
    });
  };

  const handleNext = () => {
    if (checkOverlap(startTime, endTime)) {
      setOverlapError(`Time slot from ${minutesToTime(startTime)} to ${minutesToTime(endTime)} is already booked. Please select a different time.`);
      return;
    }
    setOverlapError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    onClose();
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

    try {
      const booking: CreateBookingRequest = {
        name: name.trim(),
        startTime: minutesToTime(startTime),
        endTime: minutesToTime(endTime),
        date: currentDate,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (response.ok) {
        onBookingCreated();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{rangeSliderStyles}</style>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-[390px] mx-auto bg-[#2C2C2C] rounded-t-2xl p-6 flex flex-col gap-4 shadow-lg">
          {step === 1 ? (
            <>
              {/* Duration Step */}
              <div className="flex flex-col gap-3">
                {/* Label */}
                <div className="flex justify-between items-start">
                  <span className="text-white text-base font-inter">Set start and stop</span>
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
                  <span className="text-white/70 font-inter">
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
                  className="flex items-center gap-2 px-3 py-3 bg-[#E3E3E3] border border-[#767676] rounded-lg hover:bg-[#D5D5D5] transition-colors"
                >
                  <X className="w-4 h-4 text-[#1E1E1E]" strokeWidth={1.6} />
                  <span className="text-[#1E1E1E] text-base font-inter">Cancel</span>
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-3 py-3 bg-[#F5F5F5] border border-[#2C2C2C] rounded-lg hover:bg-[#ECECEC] transition-colors"
                >
                  <span className="text-[#1E1E1E] text-base font-inter">Next</span>
                  <ArrowRight className="w-4 h-4 text-[#1E1E1E]" strokeWidth={1.6} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Name Step */}
              <div className="flex flex-col gap-2">
                <label className="text-white text-base font-inter">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="px-4 py-3 bg-[#3C3C3C] border border-[#505050] rounded-lg text-white text-base font-inter placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14AE5C]"
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-3 bg-[#E3E3E3] border border-[#767676] rounded-lg hover:bg-[#D5D5D5] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[#1E1E1E]" strokeWidth={1.6} />
                  <span className="text-[#1E1E1E] text-base font-inter">Back</span>
                </button>

                <button
                  onClick={handleBookIt}
                  disabled={!name.trim()}
                  className="flex items-center gap-2 px-3 py-3 bg-[#2C2C2C] border border-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-white text-base font-inter">Book it</span>
                  <Zap className="w-4 h-4 text-white" strokeWidth={1.6} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
