import puppeteer, { Browser } from "puppeteer";
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { getBody } from "../../emails/emailBodyUser";

sgMail.setApiKey(process.env.STRIPE_EMAIL_KEY as string); // Replace with your real API key



// export async function generatePdf(html: string): Promise<Buffer> {
//   const browser: Browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   await page.setContent(html, { waitUntil: "networkidle0" });

//   const pdfBuffer: Buffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
//   });

//   await browser.close();
//   return pdfBuffer;
// }

// export async function sendEmailWithAttachment(
//   toEmail: string,
//   subject: string,
//   htmlBody: string,
//   pdfBuffer: Buffer
// ): Promise<void> {

//      console.log(`✅ Email sending to ${toEmail}`);

//   const msg: MailDataRequired = {
//     to: toEmail,
//     from: { email: "creativerides@galetti.chantlab.com", name: "creative rides" },
//     subject,
//     html: htmlBody,
//     attachments: [
//       {
//         content: pdfBuffer.toString("base64"),
//         filename: "invoice_47.pdf",
//         type: "application/pdf",
//         disposition: "attachment",
//       },
//     ],
//   };

//   await sgMail.send(msg);
//   console.log(`✅ Email sent to ${toEmail}`);
// }


export async function generatePdf(html: string): Promise<Buffer> {
    const browser: Browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    // Puppeteer returns a Uint8Array — convert explicitly to Buffer
    const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    
    const pdfBuffer = Buffer.from(pdfUint8); // ✅ ensure it's a real Buffer
    await browser.close();
    
    return pdfBuffer;
}

export async function sendEmailWithAttachment(
    // toEmail: string,
    // subject: string,
    // htmlBody: string,
    // pdfBuffer: Buffer
): Promise<void> {
    const  toEmail= "developboy47@gmail.com";
    const subject= "Your Invoice jagveer";
    const htmlBody= "<p>Please find your invoice attached.</p>";
    let emailData ={}
    const templateHtml = await getBody(emailData, "emailIncoice");
    const pdfBuffer = await generatePdf(templateHtml); 
    
    const msg: MailDataRequired = {
        to: toEmail,
        from: { email: "creativerides@galetti.chantlab.com", name: "creative rides" },
        subject,
        html: htmlBody,
        attachments: [
            {
                content: pdfBuffer.toString("base64"), // ✅ confirmed base64
                filename: "invoice_47.pdf",
                type: "application/pdf",
                disposition: "attachment",
            },
        ],
    };
    try {
         await sgMail.send(msg);
    } catch (error) {
          console.error(`⛔ -⛔ -⛔ -⛔ -⛔ -⛔ -⛔ Email err error to ${error}`);
    }
    await sgMail.send(msg);
    console.log(`-✅-✅-✅-✅ Email sent to ${toEmail}`);
}