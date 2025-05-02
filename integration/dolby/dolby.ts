import { APIMethods } from "../../helpers/utils/api_methods";
import { v4 as uuidv4 } from "uuid";
import { Service } from "typedi";
import { streaming } from "@dolbyio/dolbyio-rest-apis-client";
import { ulid } from "ulid";

@Service()
export class Dolby {
  private apiMethods = new APIMethods();

  async createStream(label: string = "Manual Auction"): Promise<{
    id: string;
    token: string;
    stream_name: string;
  }> {
    const publishTokenObj = await streaming.publishToken.create(process.env.DOLBYIO_API_SECRET, {
      label,
      streams: [
        { streamName: ulid() }, //
      ],
    });

    const { id, streams, token } = publishTokenObj;

    return {
      id,
      token,
      stream_name: streams[0].streamName,
    };
  }

  async deleteStream(stream_id: any): Promise<boolean> {
    return await streaming.publishToken.deleteToken(process.env.DOLBYIO_API_SECRET, stream_id);
  }

  // async getStream(stream_id: String): Promise<boolean> {
  //   const apiResponse = await this.apiMethods.apiGet({
  //     url: process.env.MILLICAST_URL,
  //     endpoint: `publish_token/${stream_id}`,
  //     bearer: process.env.MILLICAST_API_SECRET,
  //     data: null,
  //   });

  //   const { status } = apiResponse.data;

  //   if (status == "success") {
  //     return true;
  //   }

  //   return false;
  // }
}
