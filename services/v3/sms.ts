import { Service } from "typedi";
import { Twilio } from "twilio";
import { ClientRepository } from "../../schemas/redis/client";

@Service()
export class SMSService3 {
  private twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  private async sendSMS(phone_number: string, body: string) {
    let message_id = "-1";

    message_id = await this.twilioClient.messages
      .create({
        body: body,
        from: process.env.TWILIO_FROM_NO,
        to: phone_number,
      })
      .then((message) => {
        return message.sid;
      })
      .catch((e) => {
        console.error("🔥 error:", e);
        throw e;
      });

    return message_id;
  }

  public async verify(client_entity_id: string, phone_number: string): Promise<any> {
    const client = await ClientRepository.fetch(client_entity_id);
    if (!client.name) {
      throw new Error("Client not found.");
    }

    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000);

    const message = `Your verification code is ${code}.\n\nKind Regards,\n${client.name}`;

    const message_id = await this.sendSMS(phone_number, message);

    console.info("📱 Sent verification OTP > message_id:", message_id);

    return {
      code: code,
    };
  }
}
