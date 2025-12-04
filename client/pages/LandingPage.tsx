import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const SHOWCASE_ITEMS = [
  {
    id: 1,
    label: "Laundry",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Ff0e95b9de1014cc0953517d0eba702d7%2F9ef43bc1c8ec4d3ebe9ffc9eb3e80bb4?format=webp&width=800",
  },
  {
    id: 2,
    label: "Meeting Room",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Ff0e95b9de1014cc0953517d0eba702d7%2F6771fcd58440497a91274e049a9ed160?format=webp&width=800",
  },
  {
    id: 3,
    label: "Yoga",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Ff0e95b9de1014cc0953517d0eba702d7%2Fedd341b020c146249333333dc2c24e93?format=webp&width=800",
  },
  {
    id: 4,
    label: "Sup Board",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Ff0e95b9de1014cc0953517d0eba702d7%2F005e6b8d774144d1bd16d6ffd5c7069a?format=webp&width=800",
  },
  {
    id: 5,
    label: "Petanque",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Ff0e95b9de1014cc0953517d0eba702d7%2Ffa6c784d0bff4ebf835c46a5f8cf7ab9?format=webp&width=800",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    purpose: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Secret feature: 10 clicks on logo to go to explore page
  const logoClickCount = useRef(0);
  const logoClickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    logoClickCount.current += 1;

    // Reset counter if more than 5 seconds pass between clicks
    if (logoClickTimeout.current) {
      clearTimeout(logoClickTimeout.current);
    }

    logoClickTimeout.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 5000);

    // Navigate to explore page on 10 clicks
    if (logoClickCount.current === 10) {
      logoClickCount.current = 0;
      if (logoClickTimeout.current) {
        clearTimeout(logoClickTimeout.current);
      }
      navigate("/explore");
    }
  };

  const handlePrevSlide = () => {
    setCarouselIndex(
      (prev) => (prev - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length,
    );
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send email via backend
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep("submitted");
        setFormData({ name: "", email: "", purpose: "" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting early access request:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset form after a short delay to allow smooth modal close animation
    setTimeout(() => {
      setStep("form");
      setFormData({ name: "", email: "", purpose: "" });
    }, 200);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/icon.svg"
            alt="Book-a-thing Logo"
            className="h-[70px] w-[70px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          />
        </div>

        {/* Hero Title */}
        <h1 className="font-alegreya text-4xl md:text-5xl font-bold text-center text-[#2C2C2C] mb-6 leading-snug">
          Book-a-thing is a very simple booking system with pretty much zero
          hazzle.
        </h1>

        {/* Images - Desktop Grid / Mobile Carousel */}
        <div className="w-full mb-12">
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-2 md:gap-3">
            {SHOWCASE_ITEMS.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="relative mb-4">
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-lg font-medium text-gray-600 overflow-hidden">
                <img
                  src={SHOWCASE_ITEMS[carouselIndex].image}
                  alt={SHOWCASE_ITEMS[carouselIndex].label}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrevSlide}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Previous item"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-1 flex-1">
                {SHOWCASE_ITEMS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === carouselIndex
                        ? "bg-gray-700 w-6"
                        : "bg-gray-300 w-2"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextSlide}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Next item"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Concept Explanation */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            Book-a-thing is a community sharing platform that makes it easy for
            neighbors to borrow and share resources. Whether it's a laundry
            machine, a barbecue, a meeting room, or any other shared asset, you
            can manage availability and bookings effortlessly.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Perfect for communities, coworking spaces, residential complexes,
            and anyone looking to maximize resource utilization while building
            stronger connections with those around them.
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-4 py-8 max-w-md mx-auto w-full">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-14 bg-primary text-white text-lg font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Request early access
        </Button>
      </div>

      {/* Early Access Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            onClick={handleModalClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm pointer-events-auto relative">
              {/* Close button */}
              <button
                onClick={handleModalClose}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </button>

              {/* Content */}
              <div className="pr-6">
                {step === "form" ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Request Early Access
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Tell us about yourself and what you'd like to share with
                      your community
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-[#2C2C2C] mb-2"
                        >
                          Your Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-[#2C2C2C] mb-2"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="purpose"
                          className="block text-sm font-medium text-[#2C2C2C] mb-2"
                        >
                          What would you like to share?
                        </label>
                        <textarea
                          id="purpose"
                          name="purpose"
                          required
                          value={formData.purpose}
                          onChange={handleInputChange}
                          placeholder="e.g., Laundry machine, Meeting room, Trailer..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-10 bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isLoading ? "Sending..." : "Request early access"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Thanks for signing up!
                    </h2>
                    <p className="text-sm text-gray-600">
                      We'll get back to you soon with updates on Book-a-thing.
                    </p>
                    <Button
                      onClick={handleModalClose}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
