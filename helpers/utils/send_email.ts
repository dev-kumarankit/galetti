import nodemailer from "nodemailer";
import { stripHtml } from "./strip_html";

interface IEmailOptions {
  subject: string;
  body: string;
  to: string;
}

export async function sendEmail(options: IEmailOptions) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.GOOGLE_MAIL_EMAIL,
        pass: process.env.GOOGLE_MAIL_PASS,
      },
    });

    // transporter.verify().then(console.log).catch(console.error);

    await transporter
      .sendMail({
        from: `"${process.env.GOOGLE_MAIL_EMAIL_NAME}" <${process.env.GOOGLE_MAIL_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: stripHtml(options.subject),
        html: options.body,
      })
      .then((info) => {
        console.log({ info });
      })
      .catch(console.error);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
