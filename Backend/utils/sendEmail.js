import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      // These must match the names in your .env exactly
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const recipient = options.to || options.email;

  if (!recipient) {
    throw new Error("Nodemailer Error: No recipient address provided.");
  }

  const mailOptions = {
    from: '"FixIt Pro Admin" <admin@fixitpro.com>',
    to: recipient,
    subject: options.subject,
    html: options.html || options.message, 
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to: ${recipient}`);
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw error;
  }
};

export default sendEmail;