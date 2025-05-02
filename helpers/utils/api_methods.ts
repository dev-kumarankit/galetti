import axios, { AxiosRequestHeaders, Method } from "axios";
import { Container } from "typedi";
import { Logger } from "../logger";

export class APIMethodProps {
  constructor() {}

  url: String;
  headers?: AxiosRequestHeaders;
  endpoint: String;
  bearer?: String;
  data?: Object;
}

export class APIMethods {
  logger = Container.get(Logger);

  public async apiGet(props: APIMethodProps) {
    return await this.makeCall("GET", props);
  }

  public async apiPost(props: APIMethodProps) {
    return await this.makeCall("POST", props);
  }

  public async apiPut(props: APIMethodProps) {
    return await this.makeCall("PUT", props);
  }

  public async apiDelete(props: APIMethodProps) {
    return await this.makeCall("DELETE", props);
  }

  private async makeCall(method: Method, props: APIMethodProps) {
    return await axios({
      method,
      url: `${props.url}${props.endpoint ? `/${props.endpoint}` : ""}`,
      // responseType: "json",
      headers: props.bearer
        ? {
            ...props.headers,
            Authorization: `Bearer ${props.bearer}`,
            "content-type": "application/json",
          }
        : props.headers,
      data: props.data,
    })
      .then((response) => {
        this.logger.logger.silly(`${props.endpoint} SUCCESS:`, response);

        return response;
      })
      .catch((error) => {
        this.logger.logger.error(`🔥 ${props.endpoint} ERROR:`, error);

        return this.extractErrorMessage(error);
      });
  }

  private extractErrorMessage(error) {
    // TODO!!!

    // let message = error;
    // if (error && error.response && error.response.data && error.response.data.message) {
    //     //message = error.response.data.message;
    //     message = error.response.data;
    // } else if (error && error.response && error.response.data) {
    //     message = error.response.data;
    // } else if (error && error.response) {
    //     message = error.response;
    // } else if (error) {
    //     message = error;
    // }
    // return message;
    return error.response;
  }
}
