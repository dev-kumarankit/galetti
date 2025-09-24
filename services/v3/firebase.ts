import { Service } from "typedi";
import { EntityId } from "redis-om";
import ValidationError from "../../helpers/validation_error";
import { UserRepository } from "../../schemas/redis/user";
import { FirebaseTokenRepository } from "../../schemas/redis/firebase_token";
import { IFirebaseToken } from "../../models/firebase_token";
import { INotification } from "../../interfaces/INotification";
import { MulticastMessage, getMessaging } from "firebase-admin/messaging";

@Service()
export class FirebaseService3 {
  public async preserveToken(data: IFirebaseToken): Promise<any> {
    const { user_entity_id, token, device_id } = data;

    const user = await UserRepository.fetch(user_entity_id);

    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    const existingToken = await FirebaseTokenRepository.search() //
      .where("user_entity_id")
      .eq(user_entity_id)
      .and("device_id")
      .eq(device_id)
      .return.first();

    let savedToken = null;

    if (existingToken) {
      // update the token for this device
      savedToken = await FirebaseTokenRepository.save(existingToken[EntityId as any], {
        ...existingToken,
        token: token,
      });
    } else {
      // save the token for this device
      savedToken = await FirebaseTokenRepository.save({
        user_entity_id: user_entity_id,
        token: token,
        device_id: device_id,
      });
    }

    return savedToken;
  }

  async getUserTokens(user_entity_id: string): Promise<any[]> {
    const user = await UserRepository.fetch(user_entity_id);

    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    const tokens = await FirebaseTokenRepository.search() //
      .where("user_entity_id")
      .eq(user_entity_id)
      .return.all();

    return tokens;
  }

  async sendNotificationToEveryone(notification: INotification): Promise<any> {
    const msg = {
      ...notification,
      // all_devices_dev or all_devices_prod
      topic: `all_devices_${process.env.NODE_ENV == "PROD" ? "prod" : "dev"}`,
    };

    getMessaging()
      .send(msg)
      .then((response) => {
        console.log("sendNotificationToEveryone response", response);
      });
  }

  async sendNotificationToUsers(notification: INotification, user_entity_ids: string[]): Promise<any> {
    if (user_entity_ids && user_entity_ids.length > 0) {
      console.log("Sending notification to users", user_entity_ids);

      for (const user_entity_id of user_entity_ids) {
        if (user_entity_id) {
          try {
            const userTokens = await this.getUserTokens(user_entity_id);

            if (userTokens.length > 0) {
              const msg: MulticastMessage = {
                ...notification,
                tokens: userTokens.map((ut) => ut.token),
              };

              // Note: Max 500 tokens can be sent in one multicast request.
              getMessaging()
                .sendEachForMulticast(
                  msg,
                  // {
                  //   data: {
                  //     title: msg.notification.title,
                  //     body: msg.notification.body,
                  //   },
                  //   tokens: userTokens.map((ut) => ut.token),
                  // }
                )
                .then((response) => {
                  if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                      if (!resp.success) {
                        console.error("Failed to send notification to", userTokens[idx].token, resp.error);
                      }
                    });
                  } else {
                    console.log("Successfully sent notification to the specified users.");
                  }
                });
            } else {
              console.log("No tokens found for this user to be able to send.", user_entity_id);
            }
          } catch (e) {
            console.error("Failed to send notification to user.", user_entity_id, e);
          }
        }
      }
    }
  }
}
