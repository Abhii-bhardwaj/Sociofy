
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

const Query = mongoose.model("Query", {
  userId: String, // Optional, if user is logged in
  question: String,
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  email: String, // Optional, for follow-up
});

function questionWasAnswered(question) {
  const faqs = require("./faqData").faqs;
  const lowerCaseQuery = question.toLowerCase();

  return faqs.some(
    (faq) =>
      faq.question.toLowerCase().includes(lowerCaseQuery) ||
      lowerCaseQuery.includes(faq.question.toLowerCase().replace(/[?']/g, ""))
  );
}

// Send email to support team
async function sendSupportEmail(question, userInfo) {
  const transporter = nodemailer.createTransport({
    // Your email configuration here
    host: "smtp.example.com",
    port: 587,
    auth: {
      user: "support@sociofy.work.gd",
      pass: "your-email-password",
    },
  });

  await transporter.sendMail({
    from: "support-bot@sociofy.work.gd",
    to: "support@sociofy.work.gd",
    subject: "New Unresolved Support Query",
    text: `
      A user has submitted a question that may require human assistance:
      
      User: ${userInfo}
      Question: ${question}
      Time: ${new Date().toLocaleString()}
      
      Please review and respond as needed.
    `,
    html: `
      <h3>New Support Request</h3>
      <p>A user has submitted a question that may require human assistance:</p>
      <p><strong>User:</strong> ${userInfo}</p>
      <p><strong>Question:</strong> ${question}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p>Please review and respond as needed.</p>
    `,
  });
}

export const ChatbotController = async (req, res) => {
  try {
    const { userId, question, email } = req.body;

    // Create new query record
    const newQuery = new Query({
      userId,
      question,
      email,
    });

    await newQuery.save();

    // Send notification email for urgent or unresolved queries
    if (!questionWasAnswered(question)) {
      await sendSupportEmail(question, email || "Anonymous User");
    }

    res.status(201).json({ success: true, id: newQuery._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};