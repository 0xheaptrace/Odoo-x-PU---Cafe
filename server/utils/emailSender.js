// Reusable email sender using Nodemailer and Gmail SMTP
const nodemailer = require('nodemailer')

const BRAND_NAME = 'Folk & Forks'
const BRAND_TAGLINE = 'Crafted for Every Craving'
const BRAND_POS_NAME = 'Folk & Forks POS'
const BRAND_PRIMARY = '#F59E0B'
const BRAND_DARK = '#0F172A'

// Create and return a configured Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Send a generic HTML email to the given recipient
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  })
}

const emailShell = (title, body) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: ${BRAND_DARK};">
    <div style="border-bottom: 3px solid ${BRAND_PRIMARY}; padding-bottom: 14px; margin-bottom: 22px;">
      <h2 style="color: ${BRAND_DARK}; margin: 0;">${title}</h2>
      <p style="color: ${BRAND_PRIMARY}; margin: 6px 0 0; font-weight: 700;">${BRAND_TAGLINE}</p>
    </div>
    ${body}
    <p style="color: #888; font-size: 12px; margin-top: 30px;">${BRAND_POS_NAME}</p>
  </div>
`

// Send booking confirmation email with reservation details
const sendBookingConfirmation = async (customer, booking) => {
  const html = emailShell(
    `${BRAND_NAME} - Booking Confirmed`,
    `
      <p>Hi ${customer.name},</p>
      <p>Your table reservation has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(booking.date).toLocaleDateString()}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.time}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Guests</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.numberOfGuests}</td></tr>
        <tr><td style="padding: 8px;"><strong>Status</strong></td><td style="padding: 8px;">${booking.status}</td></tr>
      </table>
      <p>We look forward to seeing you!</p>
    `,
  )

  if (customer.email) {
    await sendEmail(customer.email, `Booking Confirmation - ${BRAND_NAME}`, html)
  }
}

// Send order receipt email with itemized breakdown
const sendReceiptEmail = async (customer, order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.lineTotal.toFixed(2)}</td>
        </tr>`,
    )
    .join('')

  const html = emailShell(
    `${BRAND_NAME} - Receipt`,
    `
      <p>Hi ${customer.name},</p>
      <p>Thank you for your order <strong>${order.orderNumber}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <table style="width: 100%; margin-top: 10px;">
        <tr><td style="padding: 4px;">Subtotal</td><td style="text-align: right;">$${order.subtotal.toFixed(2)}</td></tr>
        <tr><td style="padding: 4px;">Tax</td><td style="text-align: right;">$${order.taxAmount.toFixed(2)}</td></tr>
        <tr><td style="padding: 4px;">Discount</td><td style="text-align: right;">-$${order.discountAmount.toFixed(2)}</td></tr>
        <tr style="font-weight: bold; font-size: 16px;"><td style="padding: 8px 4px;">Total</td><td style="text-align: right; padding: 8px 4px;">$${order.total.toFixed(2)}</td></tr>
      </table>
    `,
  )

  const email = customer.email
  if (email) {
    await sendEmail(email, `${BRAND_NAME} Receipt - ${order.orderNumber}`, html)
  }
}

module.exports = { sendEmail, sendBookingConfirmation, sendReceiptEmail }
