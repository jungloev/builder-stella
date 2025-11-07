import { useState } from "react";
import { X } from "lucide-react";
import { Booking } from "@shared/api";

interface BookingDetailsDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function BookingDetailsDialog({
  booking,
  isOpen,
  onClose,
  onDeleted,
}: BookingDetailsDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        onClose();
        onDeleted();
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-[85vw] max-w-sm pointer-events-auto relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Name</p>
                <p className="text-base text-gray-900">{booking.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium">Time</p>
                <p className="text-base text-gray-900">
                  {booking.startTime} – {booking.endTime}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium">Date</p>
                <p className="text-base text-gray-900">{booking.date}</p>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDeleteClick}
              className="mt-6 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Delete booking
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
            onClick={handleCancelDelete}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm pointer-events-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete booking?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this booking? This cannot be
                undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
