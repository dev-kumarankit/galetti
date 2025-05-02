import CryptoJS from "crypto-js";
import { APIMethods } from "../../../helpers/utils/api_methods";
import Container, { Service } from "typedi";
import config from "../../../config/config";
import { Logger } from "../../../helpers/logger";
import { getStatus } from "../../../helpers/constants/get_status";

interface IPeachCheckout {
  amount: number;
  shopperResultUrl: string;
  merchantTransactionId: string;
  nonce: string;
  // notificationUrl: string;
}

interface ICheckoutResponse {
  redirect_url: string;
  merchant_transaction_id: string;
}

interface IStatusResponse {
  status_code: string;
  status_name: string;
  status_description: string;
}

@Service()
export class Peach {
  private apiMethods = new APIMethods();
  private loggerInstance = Container.get(Logger);

  async checkout({
    amount,
    shopperResultUrl, //
    merchantTransactionId,
    nonce,
  }: // notificationUrl,
  IPeachCheckout): Promise<ICheckoutResponse> {
    //TODO lets get this somehow from the DB

    // const url = "http://localhost.me";
    // const amount = "20";
    // const transactionId = "Test1234";
    // const nonceValue = (Math.random() * (1000000 - 2000000) + 1000000).toFixed(0);

    const notificationUrl = process.env.PEACH_WEBHOOK_URL;

    this.loggerInstance.logger.silly("nonceValue %o", nonce);
    let stringToHash = `amount${amount}authentication.entityId${process.env.PEACH_ENTITYID}currencyZARdefaultPaymentMethodCARDmerchantTransactionId${merchantTransactionId}nonce${nonce}notificationUrl${notificationUrl}paymentTypeDBshopperResultUrl${shopperResultUrl}`;
    this.loggerInstance.logger.silly("stringToHash %o", stringToHash);

    const hash = CryptoJS.HmacSHA256(stringToHash, process.env.PEACH_SECRETKEY);
    const signature = hash.toString(CryptoJS.enc.Hex);
    this.loggerInstance.logger.silly("hash signature %o", signature);

    const data = {
      amount: amount.toString(),
      "authentication.entityId": process.env.PEACH_ENTITYID,
      currency: "ZAR",
      defaultPaymentMethod: "CARD",
      merchantTransactionId: merchantTransactionId,
      nonce: nonce,
      notificationUrl: notificationUrl,
      paymentType: "DB",
      shopperResultUrl: shopperResultUrl,
      signature: signature,
    };
    this.loggerInstance.logger.silly("Peach checkout data %o", data);

    const response = await this.apiMethods.apiPost({
      url: process.env.PEACH_URL,
      endpoint: `checkout/initiate`,
      headers: {
        Referer: "", // TODO check
        "Content-Type": "application/json",
      },
      data: data,
    });

    this.loggerInstance.logger.silly("Peach checkout response %o", response);

    return {
      redirect_url: response.data.redirectUrl,
      merchant_transaction_id: merchantTransactionId,
    };
  }

  async status({
    // checkoutId,
    merchantTransactionId,
  }): Promise<IStatusResponse> {
    // let stringToHash = `authentication.entityId${process.env.PEACH_ENTITYID}`;
    // let stringToHash = `authentication.entityId${process.env.PEACH_ENTITYID}checkoutId${checkoutId}`;
    let stringToHash = `authentication.entityId${process.env.PEACH_ENTITYID}merchantTransactionId${merchantTransactionId}`;
    this.loggerInstance.logger.silly("stringToHash %o", stringToHash);
    const hash = CryptoJS.HmacSHA256(stringToHash, process.env.PEACH_SECRETKEY);
    const signature = hash.toString(CryptoJS.enc.Hex);
    this.loggerInstance.logger.silly("hash signature %o", signature);

    const response = await this.apiMethods.apiGet({
      url: process.env.PEACH_URL,
      // endpoint: `status?authentication.entityId=${process.env.PEACH_ENTITYID}&signature=${signature}`,
      // endpoint: `status?authentication.entityId=${process.env.PEACH_ENTITYID}&checkoutId=${checkoutId}&signature=${signature}`,
      endpoint: `status?authentication.entityId=${process.env.PEACH_ENTITYID}&merchantTransactionId=${merchantTransactionId}&signature=${signature}`,
      headers: {
        accept: "application/json",
      },
    });

    let statusResponse = await getStatus(response.data["result.code"]);

    this.loggerInstance.logger.silly("Peach status response %o", response.data);

    return {
      status_code: response.data["result.code"],
      status_name: statusResponse.status_name,
      status_description: statusResponse.status_description,
    };
  }
}
