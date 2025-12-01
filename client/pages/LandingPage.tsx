import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    purpose: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/icon.svg"
            alt="Book-a-thing Logo"
            className="h-16 w-16 object-contain"
          />
        </div>

        {/* Hero Title */}
        <h1 className="font-alegreya text-4xl md:text-5xl font-bold text-center text-[#2C2C2C] mb-6 leading-snug">
          Book-a-thing is a very simple booking system with pretty much zero
          hazzle.
        </h1>

        {/* Images Grid - Placeholder for future images */}
        <div className="w-full mb-12">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
              Laundry
            </div>
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
              Trailers
            </div>
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
              BBQs
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Images coming soon
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="px-4 py-8 max-w-md mx-auto w-full">
        {step === "form" ? (
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
              className="w-full h-12 bg-[#2C2C2C] text-white font-medium hover:bg-opacity-90 transition-colors"
            >
              {isLoading ? "Sending..." : "Request early access"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
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
            <h2 className="text-2xl font-bold text-[#2C2C2C]">
              Thanks for signing up!
            </h2>
            <p className="text-gray-600">
              We'll get back to you soon with updates on Book-a-thing.
            </p>
            <Button
              onClick={() => setStep("form")}
              variant="outline"
              className="w-full mt-6"
            >
              Sign up another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
