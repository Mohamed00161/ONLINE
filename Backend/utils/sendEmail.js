import { Resend } from 'resend';

// REMOVE the top-level initialization: const resend = new Resend(...)

const sendEmail = async ({ to, subject, html }) => {
  // Initialize INSIDE the function so it catches the API key after dotenv loads
  const apiKey = process.env.EMAIL_API_KEY;
  
  if (!apiKey) {
    console.error("❌ CRITICAL ERROR: EMAIL_API_KEY is undefined in process.env");
    throw new Error("Missing API key for Resend");
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'FixIt <onboarding@resend.dev>', // Must use this on free tier
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend API Error:", error.message);
      throw new Error(error.message);
    }

    console.log("✅ Email sent successfully ID:", data.id);
    return data;
  } catch (err) {
    console.error("Email processing failed:", err.message);
    throw err;
  }
};

export default sendEmail;