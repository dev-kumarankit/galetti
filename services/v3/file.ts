import Container, { Service } from "typedi";
import { CloudStorage } from "../../integration/google/cloud_storage";
import { FileRepository } from "../../schemas/redis/file";
import { EntityId } from "redis-om";
import moment from "moment-timezone";
import { redisClient } from "../../integration/redis/redis";
import ValidationError from "../../helpers/validation_error";

@Service()
export class FileService3 {
  private cloudStorage = Container.get(CloudStorage);

  public async upload(body, files) {
    const {
      auction_entity_id,
      lot_entity_id,
      user_entity_id,
      bidder_entity_id,
      custom_name,
      type,
      other_info,
    } = body;

    const file = files.file; // Can only upload one file at a time.

    // Technically only one of these fields should be present, but not more than one. This is enforced by the route's celebration.
    let identify = "";
    // DONT use `:` in the identify string, it will occasionally break the URL and return wrong files.
    if (auction_entity_id) {
      identify = `AUCTION_${auction_entity_id}`;
    }
    if (lot_entity_id) {
      identify = `LOT_${lot_entity_id}`;
    }
    if (user_entity_id) {
      identify = `USER_${user_entity_id}`;
    }
    if (bidder_entity_id) {
      identify = `BIDDER_${bidder_entity_id}`;
    }

    // This identifier should be a string with one of the entity IDs.
    console.info("Uploading a file for:", identify);

    const uploadedFile: any = await this.cloudStorage.uploadFile({
      file: file,
      type: type,
      directory: identify,
    });

    const result = await FileRepository.save({
      file_name: file.name,
      file_extension: file.name.split(".").pop() ?? "",
      custom_name: custom_name,
      type: type,
      uploaded_file_url: uploadedFile.url,
      directory: uploadedFile.directory,
      auction_entity_id,
      lot_entity_id,
      user_entity_id,
      bidder_entity_id,
      created_at: moment().tz("Africa/Johannesburg").unix(),
      other_info: other_info,
    });

    const resultWithEntityId = {
      ...result,
      entity_id: result[EntityId],
    };

    return resultWithEntityId;
  }

  public async retrieve(body) {
    // Technically only one of these fields should be present, but not more than one. This is enforced by the route's celebration.
    const {
      auction_entity_id,
      lot_entity_id,
      user_entity_id,
      bidder_entity_id,
    } = body;

    let results = [];
    // Also these if's kind of ensures that only one of these fields is setting the results.
    if (auction_entity_id) {
      results = await FileRepository.search() //
        .or("auction_entity_id")
        .eq(auction_entity_id)
        .return.all();
    }
    if (lot_entity_id) {
      results = await FileRepository.search() //
        .or("lot_entity_id")
        .eq(lot_entity_id)
        .return.all();
    }
    if (user_entity_id) {
      results = await FileRepository.search() //
        .or("user_entity_id")
        .eq(user_entity_id)
        .return.all();
    }
    if (bidder_entity_id) {
      results = await FileRepository.search() //
        .or("bidder_entity_id")
        .eq(bidder_entity_id)
        .return.all();
    }

    const resultsWithEntityIds = results.map((result) => {
      return {
        ...result,
        uploaded_file_url: encodeURI(result.uploaded_file_url),
        entity_id: result[EntityId],
      };
    });

    return resultsWithEntityIds;
  }

  public async delete(body) {
    const { file_entity_id } = body;

    // const result = await FileModel.deleteOne({ _id: new Types.ObjectId(file_id) });

    const file = await FileRepository.fetch(file_entity_id);
    if (!file.created_at) {
      throw new Error("File not found");
    }

    try {
      // delete from cloud storage
      await this.cloudStorage.deleteFile(file.directory.toString());
    } catch (e) {
      console.error("🔥 could not delete file", e);
    }

    await FileRepository.remove(file[EntityId]);

    return true;
  }

  public async saveOrder(ordered_files) {
    const messages: string[] = [];

    const multi = redisClient.multi();
    for (const { entity_id, order } of ordered_files) {
      const file = await FileRepository.fetch(entity_id);
      if (!file.file_name) {
        messages.push(`File with entity_id ${entity_id} not found`);
        continue;
      }

      multi.json.set(`FILE:${entity_id}`, "$", {
        ...file,
        order: order,
        created_at: moment(file.created_at.toString())
          .tz("Africa/Johannesburg")
          .unix(),
        updated_at: moment().tz("Africa/Johannesburg").unix(),
      });
    }

    // FileRepository.createIndex();

    if (messages.length > 0) {
      throw new ValidationError(messages.join(", "));
    } else {
      multi.exec();
    }

    return true;
  }
}
