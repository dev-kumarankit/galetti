import sgMail from "@sendgrid/mail";

interface IEmailOptions {
  subject?: string;
  body?: string;
  to?: string;
  from_name?: string;
  from_email?: string;
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

export async function sendCustomEmail(options: {
  from_name: string;
  email_reply_to: string;
  email_from: string;
  personalizations: {
    to: { email: string }[];
    subject: string;
    html: string;
    dynamic_template_data?: any;
  }[];
}) {
  try {
    console.log("options.personalizations",options.email_from)
    await sgMail.send({
      from: { email: options.email_from, name: options.from_name },
      replyTo: { email: options.email_reply_to },
      personalizations: options.personalizations.map((p) => ({
        to: p.to,
        subject: p.subject,
        dynamic_template_data: p.dynamic_template_data,
      })),
      // Provide *default* subject + content to satisfy SendGrid’s type requirements
      subject: options.personalizations[0]?.subject || " ",
      html: options.personalizations[0]?.html || "<p> </p>",
      text: " ", // placeholder fallback (required by TS types)
    });
    
    console.log("Bulk emails sent!");
  } catch (err: any) {
    console.error("SendGrid error:", err.response?.body || err);
  }
}



