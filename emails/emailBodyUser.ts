import dotenv from "dotenv";

dotenv.config();
export const getBody = (data, type) => {
  const body = {
    getWelcomeUserTemplateBody: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
 
 
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Welcome to Galetti</title>
</head>
 <body style="margin: 0; padding: 0; margin: auto; font-family: sans-serif, serif, EmojiFont;">
  <table bgcolor: #ffffff cellspacing="0" border="0" cellpadding="0" width="100%" align="center" >
    <thead>
        <tr>
            <td style="
                  background-color: #F04F23;
                  text-align: center;
 
                display: block;
                padding: 52px;
                  background-repeat: no-repeat;
                  background-size: cover;
                ">
              <a href="https://galetti.chantlab.com/#/auctions">
                <img src="https://storage.googleapis.com/auction_platform_local/BIDDER_01JQB2143J5YJ01FSZM6CDJ34B/Document/logosecondaryupdated.png" alt="Banner" width="600" style="display:block;" />
              </a>
            </td>
          </tr>
    </thead>
    <tbody >
        <!-- Welcome Message -->
 
        <tr>
          <td style=" padding-top: 38px; padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121;">
                Dear ${data.bidderName},
            </p>
 
            <p
              style="font-size: 16px; font-weight: 600; color: #f04f23; margin-top: 8px"
            >
            Congratulations! This email confirms your registration for the ${
              data.actioneerName
            }
            </p>
 
            <p
              style="font-size: 16px; font-weight: 400; color: #637381; margin-top: 8px"
            >
            Your bidder number is ${data.bidderNumber || ""}
            </p>
            <p
            style="font-size: 16px; font-weight: 400; color: #637381; margin-top: 8px"
          >
          This auction will take place on ${data.actioneeDateAndTime} , ${
      data.location
    }
          </p>
 
            <hr  />
          </td>
        </tr>
 
        <!-- Bidder Details -->
        <tr>
          <td style="padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121">
                To login, simply use the app’s biometric login feature. The registration button will turn green confirming your active status.
            </p>
            <p style="font-size: 18px; font-weight: 500; color: #212121">
            Please note, our auction manager will contact you shortly to verify your uploaded FICA (Financial Intelligence Centre Act) documents and confirm your registration deposit payment.
            For urgent queries, please contact our office directly for immediate assistance.
            </p>
            <hr />
          </td>
        </tr>
 
        <!-- Footer Section -->
        <tr>
          <td style="padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121; text-align: center">Kind regards,</p>
            <p style="font-size: 16px; font-weight: 600; color: #212121; text-align: center">
                The Galetti Auction Team
            </p>
          </td>
        </tr>
      </tbody>
  </table>
 
</body>
 
</html>`,
    getBidderDetailsTemplateBody: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
 
 <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Welcome to Auction</title>
</head>
 
<body style="margin: 0; padding: 0; margin: auto; font-family: sans-serif, serif, EmojiFont;">
  <table bgcolor: #ffffff cellspacing="0" border="0" cellpadding="0" width="100%" align="center" >
    <thead>
        <tr>
            <td style="
                  background-color: #F04F23;
                  text-align: center;
 
                display: block;
                padding: 52px;
                  background-repeat: no-repeat;
                  background-size: cover;
                ">
              <a href="https://galetti.chantlab.com/#/auctions">
                <img src="https://storage.googleapis.com/auction_platform_local/BIDDER_01JQB2143J5YJ01FSZM6CDJ34B/Document/logosecondaryupdated.png" alt="Banner" width="600" style="display:block;"/>
              </a>
            </td>
          </tr>
    </thead>
    <tbody >
 
 
        <tr>
          <td style=" padding-top: 38px; padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121;">
                A new bidder has just registered for the ${
                  data.actionHouseName
                } with bidder number ${data.bidderNumber || ""}.
            </p>
 
          <hr/>
          </td>
        </tr>
 
        <tr>
          <td style="padding-left: 38px; padding-right: 38px;">
            <p
              style="
                font-size: 16px;
                font-weight: 600;
                color: #212121;
                margin-bottom: 16px;
              "
            >
            FICA documents can be viewed in the Chant Lab console under the following link: https://console.chantlab.com/#/console/auctions/auction/${
              data.auctionId
            }
            </p>
            <hr/>
 
            <p style="font-size: 16px; font-weight: 600; color: #212121; text-align: center">
              Regards  The Galetti Team
            </p>
          </td>
        </tr>
      </tbody>
  </table>
 
</body>
 
</html>`,
  };

  return body[type];
};
