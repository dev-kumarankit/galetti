import { APIMethods } from "../../../helpers/utils/api_methods";
import { Service } from "typedi";
import config from "../../../config/config";

@Service()
export class Ozow {
  private apiMethods = new APIMethods();

  // async autoComplete(input: string): Promise<boolean> {
  //   const apiResponse = await this.apiMethods.apiGet({
  //     url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURI(input)}&key=${config.googleMapsApiKey}`,
  //     endpoint: ``,
  //     bearer: null,
  //     data: null,
  //   });

  //   if (apiResponse.data.status == "OK") {
  //     return apiResponse.data.predictions ?? [];
  //   }

  //   return null;
  // }
}
