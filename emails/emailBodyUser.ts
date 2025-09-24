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

customEmail:`
<table cellpadding="0" cellspacing="0" width="100%" style="font-family: Arial, sans-serif;">
  <tr>
    <td align="center" bgcolor="#ffffff" style="padding: 20px;">
      <table cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #ddd; background-color: #fff;">
        <tr>
          <td align="center" style="padding: 20px 0; background-color: #F04F23"">
            <a href="https://galetti.chantlab.com/#/auctions">
                <img src="https://storage.googleapis.com/auction_platform_local/BIDDER_01JQB2143J5YJ01FSZM6CDJ34B/Document/logosecondaryupdated.png" alt="Banner" width="160px" style="display:block;"/>
              </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; color: #000; font-size: 16px;">
            <p>Dear ${data.bidderName}</p>
            <p style="color: #d42c2c; font-weight: bold; font-size: 18px;">Welcome To Galetti!</p>
            <p>
         ${data.email_msg}
            </p>
            <hr style="margin: 20px 0;" />
            <p style="font-weight: bold;">Auction Details:</p>
            <p>Auction Name : ${data.actionHouseName}</p>
            <p>Auction Date & Time : ${data.actioneeDateAndTime}</p>
            <hr style="margin: 20px 0;" />
            <p>For Any Further Queries Please Contact Us Directly ${data.actionHouseName}</p>
            <p>Contact Email: ${data.email}</p>
            <p style="margin-top: 30px;">Regards The Galetti Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
emailIncoice:`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Geliti – Auction Invoice</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    /* ---------- Page & Print Setup ---------- */
    @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
    html, body { padding: 0; margin: 0; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #222; line-height: 1.32; }

    .header, .footer {
      position: fixed;
      left: 0; right: 0;
      color: #666; font-size: 11px;
    }
    .header { top: 0; height: 0; }
    .footer { bottom: 0; height: 0; }

    /* If you also use Puppeteer headerTemplate/footerTemplate, remove these blocks. */
    .footer .content {
      display: flex; justify-content: space-between; align-items: center;
    }

    /* ---------- Layout ---------- */
    .wrap { padding-top: 8px; }
    .brand-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand svg { height: 28px; }
    .brand h1 { font-size: 22px; margin: 0; letter-spacing: 0.5px; }
    .brand small { display:block; font-size: 11px; color:#666; margin-top:2px; }

    .meta-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; margin: 10px 0 12px; }
    .card { border: 1px solid #e2e2e2; border-radius: 8px; padding: 10px; }
    .card h3 { font-size: 12px; margin: 0 0 6px; color:#333; text-transform: uppercase; letter-spacing: .6px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 12px; }
    .row div b { color:#111; }
    .muted { color:#666; }

    /* ---------- Tables ---------- */
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
    thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color:#555; border-bottom: 1px solid #ddd; }
    tbody tr { page-break-inside: avoid; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .nowrap { white-space: nowrap; }
    .subtle { color:#555; }
    .strong { font-weight: 600; color:#111; }
    .totals { margin-top: 10px; }
    .totals table tr td { border: none; }
    .totals .label { color:#444; }
    .totals .value { text-align:right; }
    .hl { background: #fafafa; }

    /* ---------- Sections ---------- */
    .section { margin: 14px 0; }
    .section h2 { font-size: 14px; margin: 0 0 8px; letter-spacing: .4px; color:#222; }
    .pill { display:inline-block; font-size:10px; padding:3px 8px; border:1px solid #ddd; border-radius:999px; color:#444; }

    .two-col { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .note { font-size: 11px; color:#555; }

    /* ---------- Page Control ---------- */
    .page-break { page-break-after: always; }
    .avoid-break { page-break-inside: avoid; }

    /* ---------- Signature ---------- */
    .sign-row { display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 26px; }
    .sign-box { border-top: 1px dashed #bbb; padding-top: 8px; font-size: 12px; color:#444; }
  </style>
</head>
<body>

  <!-- Optional footer for page numbers when not using Puppeteer templates -->
  <div class="footer">
    <div class="content">
      <div>Geliti Auctions • www.geliti.example</div>
      <div class="text-right">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
    </div>
  </div>

  <div class="wrap">
    <!-- Brand / Title -->
    <div class="brand-line">
      <div class="brand">
        <!-- Inline SVG logo (placeholder wordmark) -->
        <svg viewBox="0 0 220 40" xmlns="http://www.w3.org/2000/svg" aria-label="Geliti Logo">
          <text x="0" y="28" font-size="28" font-family="Segoe UI, Arial, sans-serif" fill="#111" font-weight="700">geliti</text>
        </svg>
        <div>
          <h1>Invoice / Tax Invoice</h1>
          <small>Brand: Geliti Auctions Pvt. Ltd.</small>
        </div>
      </div>
      <div class="pill">Original</div>
    </div>

    <!-- Top Meta -->
    <div class="meta-grid">
      <div class="card">
        <h3>Auction Details</h3>
        <div class="row">
          <div><b>Auction ID:</b> AU-{{auction_id || 2025-0817}}</div>
          <div><b>Auction Name:</b> {{auction_name || “Modern Art Evening Sale”}}</div>
          <div><b>Start:</b> {{auction_start || 18 Aug 2025, 18:00 IST}}</div>
          <div><b>End:</b> {{auction_end || 18 Aug 2025, 21:30 IST}}</div>
          <div><b>Location:</b> {{auction_location || Mumbai, IN}}</div>
          <div><b>Currency:</b> {{currency || INR}}</div>
        </div>
      </div>
      <div class="card">
        <h3>Invoice</h3>
        <div class="row">
          <div><b>Invoice No.:</b> INV-{{invoice_no || 1001}}</div>
          <div><b>Issue Date:</b> {{issue_date || 22 Aug 2025, 16:15 IST}}</div>
          <div><b>Payment Due:</b> {{due_date || 29 Aug 2025}}</div>
          <div><b>Reference:</b> {{reference || PO-7783}}</div>
        </div>
      </div>
      <div class="card">
        <h3>Tax Registration</h3>
        <div class="row">
          <div><b>GST/VAT No.:</b> {{tax_no || 27AAACG9999Z1Z7}}</div>
          <div><b>PAN/TIN:</b> {{pan || AAACG9999Z}}</div>
          <div><b>Place of Supply:</b> {{pos || Maharashtra}}</div>
          <div><b>Reverse Charge:</b> {{reverse_charge || No}}</div>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="two-col">
      <div class="card">
        <h3>Seller (Consignor)</h3>
        <div class="row">
          <div><b>Name:</b> {{seller_name || A. Sharma}}</div>
          <div><b>Seller Code:</b> {{seller_code || S-1042}}</div>
          <div><b>Address:</b> {{seller_address || 12 Marine Rd, Mumbai 400001}}</div>
          <div><b>GST/VAT:</b> {{seller_tax || 27ABCPA1111Q1ZV}}</div>
          <div><b>Email:</b> {{seller_email || seller@example.com}}</div>
          <div><b>Phone:</b> {{seller_phone || +91 98765 43210}}</div>
        </div>
      </div>
      <div class="card">
        <h3>Buyer (Bidder)</h3>
        <div class="row">
          <div><b>Name:</b> {{buyer_name || K. Verma}}</div>
          <div><b>Bidder No.:</b> {{bidder_no || B-3028}}</div>
          <div><b>Address:</b> {{buyer_address || 9 Lodha Ave, Pune 411001}}</div>
          <div><b>GST/VAT:</b> {{buyer_tax || 27ASDPK2222E1Z9}}</div>
          <div><b>Email:</b> {{buyer_email || buyer@example.com}}</div>
          <div><b>Phone:</b> {{buyer_phone || +91 98200 12345}}</div>
        </div>
      </div>
    </div>

    <!-- Shares & Rates -->
    <div class="two-col section">
      <div class="card">
        <h3>Bidder & Seller Share</h3>
        <div class="row">
          <div><b>Buyer’s Premium:</b> {{buyers_premium_pct || 15}}% on hammer</div>
          <div><b>Seller Commission:</b> {{seller_commission_pct || 10}}% of hammer</div>
          <div><b>VAT/GST on Premium:</b> {{vat_on_premium_pct || 18}}%</div>
          <div><b>TDS/Withholding (Seller):</b> {{tds_pct || 1}}% (where applicable)</div>
        </div>
        <div class="note">Buyer’s premium is payable by the bidder. Seller commission is deducted from hammer before remittance to seller.</div>
      </div>
      <div class="card">
        <h3>Payment Instructions</h3>
        <div class="row">
          <div><b>Bank:</b> Geliti Bank, Fort Branch</div>
          <div><b>IFSC/SWIFT:</b> GELI0000123 / GELIINBB</div>
          <div><b>A/C Name:</b> Geliti Auctions Pvt. Ltd.</div>
          <div><b>A/C No.:</b> 123456789012</div>
        </div>
        <div class="note">Please quote Invoice No. on all payments. International buyers are responsible for bank charges.</div>
      </div>
    </div>

    <!-- Lots Table -->
    <div class="section">
      <h2>Lots Summary</h2>
      <table>
        <thead>
          <tr>
            <th style="width:8%">Lot</th>
            <th style="width:30%">Item</th>
            <th class="text-right nowrap" style="width:10%">Qty</th>
            <th class="text-right nowrap" style="width:14%">Hammer</th>
            <th class="text-right nowrap" style="width:12%">Buyer Prem.</th>
            <th class="text-right nowrap" style="width:10%">VAT/GST</th>
            <th class="text-right nowrap" style="width:16%">Line Total</th>
          </tr>
        </thead>
        <tbody>
          <!-- Repeat many rows to ensure 2–3 pages. Sample data below. -->
          <!-- You can generate these server-side from your DB. -->
          <!-- START SAMPLE ROWS -->
          <tr><td>101</td><td>Modernist Vase, 1952</td><td class="text-right">1</td><td class="text-right">₹120,000.00</td><td class="text-right">₹18,000.00</td><td class="text-right">₹3,240.00</td><td class="text-right strong">₹141,240.00</td></tr>
          <tr><td>102</td><td>Abstract Canvas, 1968</td><td class="text-right">1</td><td class="text-right">₹210,000.00</td><td class="text-right">₹31,500.00</td><td class="text-right">₹5,670.00</td><td class="text-right strong">₹247,170.00</td></tr>
          <tr><td>103</td><td>Art Deco Lamp</td><td class="text-right">2</td><td class="text-right">₹80,000.00</td><td class="text-right">₹12,000.00</td><td class="text-right">₹2,160.00</td><td class="text-right strong">₹94,160.00</td></tr>
          <tr><td>104</td><td>Vintage Poster Set</td><td class="text-right">5</td><td class="text-right">₹50,000.00</td><td class="text-right">₹7,500.00</td><td class="text-right">₹1,350.00</td><td class="text-right strong">₹58,850.00</td></tr>
          <tr><td>105</td><td>Bronze Sculpture</td><td class="text-right">1</td><td class="text-right">₹360,000.00</td><td class="text-right">₹54,000.00</td><td class="text-right">₹9,720.00</td><td class="text-right strong">₹423,720.00</td></tr>
          <tr><td>106</td><td>Ink Drawing</td><td class="text-right">1</td><td class="text-right">₹95,000.00</td><td class="text-right">₹14,250.00</td><td class="text-right">₹2,565.00</td><td class="text-right strong">₹111,815.00</td></tr>
          <tr><td>107</td><td>Mid-century Chair (Pair)</td><td class="text-right">1</td><td class="text-right">₹140,000.00</td><td class="text-right">₹21,000.00</td><td class="text-right">₹3,780.00</td><td class="text-right strong">₹164,780.00</td></tr>
          <tr><td>108</td><td>Photograph Portfolio</td><td class="text-right">1</td><td class="text-right">₹60,000.00</td><td class="text-right">₹9,000.00</td><td class="text-right">₹1,620.00</td><td class="text-right strong">₹70,620.00</td></tr>
          <tr><td>109</td><td>Terracotta Figurine</td><td class="text-right">3</td><td class="text-right">₹75,000.00</td><td class="text-right">₹11,250.00</td><td class="text-right">₹2,025.00</td><td class="text-right strong">₹88,275.00</td></tr>
          <tr><td>110</td><td>Limited Edition Print</td><td class="text-right">2</td><td class="text-right">₹110,000.00</td><td class="text-right">₹16,500.00</td><td class="text-right">₹2,970.00</td><td class="text-right strong">₹129,470.00</td></tr>
          <tr><td>111</td><td>Designer Clock</td><td class="text-right">1</td><td class="text-right">₹45,000.00</td><td class="text-right">₹6,750.00</td><td class="text-right">₹1,215.00</td><td class="text-right strong">₹52,965.00</td></tr>
          <tr><td>112</td><td>Glass Centerpiece</td><td class="text-right">1</td><td class="text-right">₹88,000.00</td><td class="text-right">₹13,200.00</td><td class="text-right">₹2,376.00</td><td class="text-right strong">₹103,576.00</td></tr>
          <tr><td>113</td><td>Textile Wall Hanging</td><td class="text-right">1</td><td class="text-right">₹130,000.00</td><td class="text-right">₹19,500.00</td><td class="text-right">₹3,510.00</td><td class="text-right strong">₹153,010.00</td></tr>
          <tr><td>114</td><td>Stoneware Bowl</td><td class="text-right">4</td><td class="text-right">₹64,000.00</td><td class="text-right">₹9,600.00</td><td class="text-right">₹1,728.00</td><td class="text-right strong">₹75,328.00</td></tr>
          <tr><td>115</td><td>Metal Relief Panel</td><td class="text-right">1</td><td class="text-right">₹150,000.00</td><td class="text-right">₹22,500.00</td><td class="text-right">₹4,050.00</td><td class="text-right strong">₹176,550.00</td></tr>
          <tr><td>116</td><td>Vintage Camera</td><td class="text-right">1</td><td class="text-right">₹38,000.00</td><td class="text-right">₹5,700.00</td><td class="text-right">₹1,026.00</td><td class="text-right strong">₹44,726.00</td></tr>
          <tr><td>117</td><td>Carved Wood Panel</td><td class="text-right">2</td><td class="text-right">₹95,000.00</td><td class="text-right">₹14,250.00</td><td class="text-right">₹2,565.00</td><td class="text-right strong">₹111,815.00</td></tr>
          <tr><td>118</td><td>Studio Pottery Set</td><td class="text-right">1</td><td class="text-right">₹72,000.00</td><td class="text-right">₹10,800.00</td><td class="text-right">₹1,944.00</td><td class="text-right strong">₹84,744.00</td></tr>
          <tr><td>119</td><td>Art Nouveau Mirror</td><td class="text-right">1</td><td class="text-right">₹215,000.00</td><td class="text-right">₹32,250.00</td><td class="text-right">₹5,805.00</td><td class="text-right strong">₹253,055.00</td></tr>
          <tr><td>120</td><td>Hand-knotted Rug</td><td class="text-right">1</td><td class="text-right">₹170,000.00</td><td class="text-right">₹25,500.00</td><td class="text-right">₹4,590.00</td><td class="text-right strong">₹200,090.00</td></tr>
          <tr><td>121</td><td>Ceramic Tiles (Set of 6)</td><td class="text-right">1</td><td class="text-right">₹55,000.00</td><td class="text-right">₹8,250.00</td><td class="text-right">₹1,485.00</td><td class="text-right strong">₹64,735.00</td></tr>
          <tr><td>122</td><td>Contemporary Sculpture</td><td class="text-right">1</td><td class="text-right">₹410,000.00</td><td class="text-right">₹61,500.00</td><td class="text-right">₹11,070.00</td><td class="text-right strong">₹482,570.00</td></tr>
          <tr><td>123</td><td>Signed Lithograph</td><td class="text-right">1</td><td class="text-right">₹95,000.00</td><td class="text-right">₹14,250.00</td><td class="text-right">₹2,565.00</td><td class="text-right strong">₹111,815.00</td></tr>
          <tr><td>124</td><td>Collector’s Watch</td><td class="text-right">1</td><td class="text-right">₹260,000.00</td><td class="text-right">₹39,000.00</td><td class="text-right">₹7,020.00</td><td class="text-right strong">₹306,020.00</td></tr>
          <tr><td>125</td><td>Tribal Mask</td><td class="text-right">1</td><td class="text-right">₹86,000.00</td><td class="text-right">₹12,900.00</td><td class="text-right">₹2,322.00</td><td class="text-right strong">₹101,222.00</td></tr>
          <tr><td>126</td><td>Art Book Archive</td><td class="text-right">1</td><td class="text-right">₹44,000.00</td><td class="text-right">₹6,600.00</td><td class="text-right">₹1,188.00</td><td class="text-right strong">₹51,788.00</td></tr>
          <tr><td>127</td><td>Marble Bust</td><td class="text-right">1</td><td class="text-right">₹320,000.00</td><td class="text-right">₹48,000.00</td><td class="text-right">₹8,640.00</td><td class="text-right strong">₹376,640.00</td></tr>
          <tr><td>128</td><td>Studio Photograph (Framed)</td><td class="text-right">1</td><td class="text-right">₹58,000.00</td><td class="text-right">₹8,700.00</td><td class="text-right">₹1,566.00</td><td class="text-right strong">₹68,266.00</td></tr>
          <!-- END SAMPLE ROWS -->
        </tbody>
      </table>
    </div>

    <!-- Totals & Breakdown -->
    <div class="two-col totals avoid-break">
      <div class="card">
        <h3>Buyer Payable Summary</h3>
        <table>
          <tr><td class="label">Hammer Subtotal</td><td class="value">₹3,745,000.00</td></tr>
          <tr><td class="label">Buyer’s Premium (15%)</td><td class="value">₹561,750.00</td></tr>
          <tr><td class="label">VAT/GST on Premium (18%)</td><td class="value">₹101,115.00</td></tr>
          <tr><td class="label">Shipping & Insurance</td><td class="value">₹15,000.00</td></tr>
          <tr><td class="label">Discounts/Credits</td><td class="value">₹0.00</td></tr>
          <tr class="hl strong"><td class="label">Total Amount Due (Buyer)</td><td class="value">₹4,422,865.00</td></tr>
        </table>
        <div class="note">Amounts are inclusive/exclusive of taxes as shown. Place of supply: {{pos}}.</div>
      </div>

      <div class="card">
        <h3>Seller Settlement Summary</h3>
        <table>
          <tr><td class="label">Hammer Subtotal</td><td class="value">₹3,745,000.00</td></tr>
          <tr><td class="label">Seller Commission (10%)</td><td class="value">₹374,500.00</td></tr>
          <tr><td class="label">TDS/Withholding (1%)</td><td class="value">₹37,450.00</td></tr>
          <tr><td class="label">Restoration/Handling Fees</td><td class="value">₹0.00</td></tr>
          <tr class="hl strong"><td class="label">Net Payable to Seller</td><td class="value">₹3,333,050.00</td></tr>
        </table>
        <div class="note">Commission and applicable TDS are deducted from seller proceeds.</div>
      </div>
    </div>

    <!-- Terms & Notes -->
    <div class="section card">
      <h2>Notes & Terms</h2>
      <ol class="note">
        <li>All bids are subject to the Conditions of Sale published by Geliti Auctions Pvt. Ltd.</li>
        <li>Buyer’s premium is charged on the hammer price per lot. Taxes apply as per applicable law.</li>
        <li>Payment due within {{payment_terms || 7}} days of invoice date. Late payments may incur interest.</li>
        <li>Title passes upon receipt of cleared funds. Export/import permits, if required, are responsibility of buyer.</li>
        <li>Disputes subject to jurisdiction of {{jurisdiction || Mumbai}} courts.</li>
      </ol>
    </div>

    <!-- Signature Blocks -->
    <div class="sign-row avoid-break">
      <div class="sign-box">
        Authorised Signatory<br/>
        Geliti Auctions Pvt. Ltd.
      </div>
      <div class="sign-box">
        Accepted & Confirmed by Buyer<br/>
        Name & Signature
      </div>
    </div>

    <div class="page-break"></div>

    <!-- (Optional) Attachments / Certificates page to ensure 2–3 pages -->
    <div class="section">
      <h2>Attachments / Certificates</h2>
      <p class="note">Attach condition reports, authenticity certificates, export documentation, or additional schedules here. This page intentionally left for annexures related to the above lots.</p>
      <table>
        <thead>
          <tr>
            <th style="width:18%">Lot</th>
            <th>Attachment</th>
            <th style="width:25%">Reference</th>
            <th style="width:18%" class="text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>101</td><td>Condition Report (CR-101.pdf)</td><td>CR/101/2025</td><td class="text-right">19 Aug 2025</td></tr>
          <tr><td>105</td><td>Certificate of Authenticity</td><td>COA/105/2025</td><td class="text-right">18 Aug 2025</td></tr>
          <tr><td>119</td><td>Export Advisory Note</td><td>EXP/119/2025</td><td class="text-right">20 Aug 2025</td></tr>
          <tr><td>122</td><td>Artist Provenance Letter</td><td>PRV/122/2025</td><td class="text-right">21 Aug 2025</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Company Footer Info -->
    <div class="section note">
      <b>Registered Office:</b> 2F, Heritage Chambers, Fort, Mumbai 400001 • CIN: U74999MH2015PTC000000 • support@geliti.example • +91 22 4000 0000
    </div>

  </div>

  <script>
    // Populate page numbers if not using Puppeteer header/footer templates
    (function () {
      function onLoad() {
        const total = document.querySelector('.totalPages');
        const page = document.querySelector('.pageNumber');
        if (total && page && typeof window !== 'undefined') {
          // When printed via Chromium, these are auto-populated; otherwise fallback:
          total.textContent = total.textContent || '—';
          page.textContent = page.textContent || '—';
        }
      }
      if (document.readyState === 'complete') onLoad();
      else window.addEventListener('load', onLoad);
    })();
  </script>
</body>
</html>
`

  };

  return body[type];
};
