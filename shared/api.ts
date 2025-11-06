/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Booking type
 */
export interface Booking {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  date: string; // YYYY-MM-DD format
}

/**
 * Response type for /api/bookings GET
 */
export interface GetBookingsResponse {
  bookings: Booking[];
}

/**
 * Request type for /api/bookings POST
 */
export interface CreateBookingRequest {
  name: string;
  startTime: string;
  endTime: string;
  date: string;
}

/**
 * Response type for /api/bookings POST
 */
export interface CreateBookingResponse {
  booking: Booking;
}
