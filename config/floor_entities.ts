interface ISystemUser {
  entity_id: string;
  paddle_number: string;
  name: string;
  surname: string;
  email: string;
}

const vendor_paddle_numbers: string[] = [
  "3950", // This number 3950 has historical significance in the company. It was Joff's first paddle number, ever. Ask Joff before changing it. :)
  "9989",
  "6344",
  "2461",
  "7510",
  "1037",
  "2047",
  "8879",
  "6102",
  "9996", // 10
  "2243",
  "5603",
  "3332",
  "7088",
  "4368",
  "9625",
  "8032",
  "4870",
  "2436",
  "0954", // 20
  "5967",
  "9317",
  "4173",
  "7372",
  "8415",
  "6641",
  "6425",
  "3000",
  "0403",
  "3490", // 30
  "1445",
  "8595",
  "8577",
  "5490",
  "8280",
  "0906",
  "5141",
  "3278",
  "6057",
  "2855", // 40
];

export const FLOOR_USER: ISystemUser = {
  entity_id: "0".padStart(24, "0"),
  paddle_number: "0000",
  name: `FLOOR`,
  surname: "FLOOR",
  email: `floor@chantlab.com`,
};

const VENDOR_USERS = vendor_paddle_numbers.map((paddle_number, index) => {
  // NOTES:
  // - index starts at 0.
  // - it means [0] will be 000000000000000000000000 ("0" X 24).
  // - 000000000000000000000000 is the floor bidder's entity_id.
  // - 000000000000000000000001 and UP will be the vendor's entity_ids.

  const su: ISystemUser = {
    entity_id: `${index + 1}`.padStart(24, "0"), // prevent 000000000000000000000000 from being used, that is the floor user's.
    paddle_number: paddle_number,
    name: `VENDOR`,
    surname: `${index + 1}`,
    email: `vendor-${index + 1}@chantlab.com`,
  };

  return su;
});

export const SYSTEM_USERS: ISystemUser[] = [FLOOR_USER, ...VENDOR_USERS];

export function isSystemUser(entity_id_to_check: string): boolean {
  return SYSTEM_USERS.some((x) => x.entity_id === entity_id_to_check);
}

export function isVendorUser(entity_id_to_check: string): boolean {
  return VENDOR_USERS.some((x) => x.entity_id === entity_id_to_check);
}

export function getSystemUserByEntityId(entity_id: string): ISystemUser {
  return SYSTEM_USERS.find((x) => x.entity_id === entity_id);
}

export function getRandomVendorUser(): ISystemUser {
  const randomIndex = Math.floor(Math.random() * VENDOR_USERS.length);
  return VENDOR_USERS[randomIndex];
}
