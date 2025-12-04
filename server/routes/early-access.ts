import { RequestHandler } from "express";
import { Resend } from "resend";

interface EarlyAccessRequest {
  name: string;
  email: string;
  purpose: string;
}

export const handleEarlyAccess: RequestHandler = async (req, res) => {
  try {
    const { name, email, purpose } = req.body as EarlyAccessRequest;

    // Validate input
    if (!name || !email || !purpose) {
      return res.status(400).json({
        error: "Missing required fields: name, email, purpose",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Initialize Resend client with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send confirmation email to user
    await resend.emails.send({
      from: "Book-a-thing <onboarding@resend.dev>",
      to: email,
      subject: "Thanks for signing up for Book-a-thing!",
      html: `
        <h2>Thanks for your interest in Book-a-thing!</h2>
        <p>Hi ${name},</p>
        <p>We've received your early access request and will get back to you soon with updates on Book-a-thing.</p>
        <p>In the meantime, feel free to explore our website or reach out with any questions.</p>
        <p>Best regards,<br>The Book-a-thing Team</p>
      `,
    });

    // Send admin notification
    await resend.emails.send({
      from: "Book-a-thing <onboarding@resend.dev>",
      to: "jonathanjungloev@gmail.com",
      subject: "New Early Access Request - Book-a-thing",
      html: `
        <h2>New Early Access Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Intended Purpose:</strong></p>
        <p>${purpose.replace(/\n/g, "<br>")}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Early access request submitted successfully",
    });
  } catch (error) {
    console.error("Error handling early access request:", error);
    return res.status(500).json({
      error: "Failed to submit early access request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
