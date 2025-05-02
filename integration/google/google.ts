import { APIMethods } from "../../helpers/utils/api_methods";
import { Service } from "typedi";
import config from "../../config/config";

@Service()
export class Google {
  private apiMethods = new APIMethods();

  async autoComplete(input: string): Promise<boolean> {
    const apiResponse = await this.apiMethods.apiGet({
      url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURI(input)}&key=${config.googleMapsApiKey}`,
      endpoint: ``,
      bearer: null,
      data: null,
    });

    if (apiResponse.data.status == "OK") {
      return apiResponse.data.predictions ?? [];
    }

    return null;
  }

  async placeIdDetails(placeId: string) {
    const apiResponse = await this.apiMethods.apiGet({
      url: `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&types=geocode&key=${config.googleMapsApiKey}`,
      endpoint: ``,
      bearer: null,
      data: null,
    });

    if (apiResponse.data.status == "OK") {
      return apiResponse.data.result ?? null;
    }

    return null;
  }
}
