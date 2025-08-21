// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,        // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT,        // 465 for SSL or 587 for TLS
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,      // your email
    pass: process.env.EMAIL_PASS       // your email password / app password
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Gym System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = { sendEmail };
