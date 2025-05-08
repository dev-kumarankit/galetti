import sgMail from "@sendgrid/mail";

interface IEmailOptions {
  subject?: string;
  body?: string;
  to?: string;
}

sgMail.setApiKey(process.env.STRIPE_EMAIL_KEY); // Replace with your real API key
export async function sendEmail(options: IEmailOptions) {
  const msg = {
    to: options.to,
    from: `"${process.env.GOOGLE_MAIL_EMAIL_NAME}" <${process.env.GOOGLE_MAIL_EMAIL}>`,
    subject: options.subject,
    html: options.body,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("email sent");
    })
    .catch((error) => {
      console.error(error, "error check");
    });
}
