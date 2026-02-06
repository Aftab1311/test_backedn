const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !email || !message) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    // Configure Transporter for Zoho
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address (Must be your Zoho email)
      to: process.env.EMAIL_USER,   // Receiver address (Sending to yourself)
      replyTo: email,               // Allow replying directly to the customer
      subject: `New Contact Inquiry: ${subject || 'General Inquiry'}`,
      html: `
        <h3>New Message from SumPro Website</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    console.log('Sending email with options:', mailOptions); // Debug log

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ message: 'Failed to send email. Please try again later.' });
  }
});

module.exports = router;