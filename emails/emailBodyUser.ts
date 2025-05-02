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
            Welcome to Galetti
            </p>

            <p
              style="font-size: 16px; font-weight: 400; color: #637381; margin-top: 8px"
            >
            Thank you for registering for this auction ${data.actionHouseName}. Please be advised that our auction manager will be in contact with you shortly regarding your FICA documents as well as the required registration fee
            </p>

            <hr  />
          </td>
        </tr>

        <!-- Bidder Details -->
        <tr>
          <td style="padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121">
                Auction Details:
            </p>

            <p style="font-size: 18px; color: #637381">
              <strong>Auction Name:</strong> ${data?.actioneerName}
            </p>
            <p style="font-size: 18px; color: #637381">
              <strong>Auction Date & Time:</strong> ${data?.actioneeDateAndTime}
            </p>
            <hr />
          </td>
        </tr>

        <!-- Footer Section -->
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
            For any further queries please contact us directly ${data?.actionHouseEmail}. 
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
        <!-- Welcome Message -->

        <tr>
          <td style=" padding-top: 38px; padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121;">
              Dear ${data.actioneerName},
            </p>

            <p
              style="font-size: 16px; font-weight: 600; color: #f04f23; margin-top: 8px"
            >
              A new bidder has registered for ${data.actionHouseName}
            </p>

            <p
              style="font-size: 16px; font-weight: 400; color: #637381; margin-top: 8px"
            >
              Below are their details:
            </p>

            <hr  />
          </td>
        </tr>

        <!-- Bidder Details -->
        <tr>
          <td style="padding-left: 38px; padding-right: 38px;">
            <p style="font-size: 18px; font-weight: 500; color: #212121">
              Bidder Details:
            </p>

            <p style="font-size: 18px; color: #637381">
              <strong>Name:</strong> ${data.bidderName}
            </p>
            <p style="font-size: 18px; color: #637381">
              <strong>Email:</strong> ${data.bidderEmail}
            </p>
            <p style="font-size: 18px; color: #637381">
              <strong>Phone Number:</strong> ${data.bidderPhoneNumber}
            </p>
            <p style="font-size: 18px; color: #637381">
              <strong>Registered Auction:</strong> ${data.actionHouseName}
            </p>


            <hr />
          </td>
        </tr>

        <!-- Footer Section -->
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
              For any concerns, please log in to your console to view the full
              details: https://galetti.chantlab.com/#/auctions
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
