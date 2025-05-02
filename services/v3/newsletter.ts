import { Service } from "typedi";
import { NewsletterRepository } from "../../schemas/redis/newsletter";
import moment from "moment-timezone";

@Service()
export class NewsletterService3 {
  public async subscribe(email_address: string, client_entity_id: string) {
    let existingNewsletter = await NewsletterRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .and("email_address")
      .eq(email_address)
      .return.first();

    if (existingNewsletter) {
      throw new Error("You have already subscribed to our newsletter!");
    }

    await NewsletterRepository.save({
      client_entity_id: client_entity_id, //
      email_address: email_address,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    });

    return { email_address };
  }
}
