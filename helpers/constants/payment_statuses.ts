export const PAYMENT_STATUSES_CODE = [
  {
    PENDING: [
      {
        code: '000.200.000',
        description: 'transaction pending',
      },
      {
        code: '100.400.500',
        description: 'waiting for external risk',
      },
      {
        code: '000.200.100',
        description: 'successfully created checkout',
      },
    ],
  },
  {
    SUCCESS: [
      {
        code: '000.000.000',
        description: 'transaction succeeded',
      },
      {
        code: '000.000.100',
        description: 'successful request',
      },
      {
        code: '000.100.110',
        description:
          "Request successfully processed in 'Merchant in Integrator Test Mode'",
      },
      {
        code: '000.300.000',
        description: 'Two-step transaction succeeded',
      },
      {
        code: '000.400.110',
        description: 'Authentication successful (frictionless flow)',
      },
    ],
  },
  {
    REJECTED: [
      {
        code: '000.100.207',
        description: 'Cancellation in Clearing Network',
      },
      {
        code: '000.100.209',
        description: 'Account does not exist',
      },
      {
        code: '000.100.210',
        description: 'Invalid Amount',
      },
      {
        code: '000.400.101',
        description: 'card not participating/authentication unavailable',
      },
      {
        code: '000.400.102',
        description: 'user not enrolled',
      },
      {
        code: '000.400.103',
        description: 'Technical Error in 3D system',
      },
      {
        code: '000.400.104',
        description:
          'Missing or malformed threeDSecure Configuration for Channel',
      },
      {
        code: '000.400.105',
        description: 'Unsupported User Device - Authentication not possible',
      },
      {
        code: '000.400.106',
        description:
          'invalid payer authentication response(PARes) in 3DSecure Transaction',
      },
      {
        code: '000.400.107',
        description: 'Communication Error to VISA/Mastercard Directory Server',
      },
      {
        code: '000.400.108',
        description:
          'Cardholder Not Found - card number provided is not found in the ranges of the issuer',
      },
      {
        code: '000.400.109',
        description: 'Card is not enrolled for 3DS version 2',
      },
      {
        code: '000.400.200',
        description: 'risk management check communication error',
      },
      {
        code: '100.100.101',
        description: 'invalid or missing entity type',
      },
      {
        code: '100.100.104',
        description: 'invalid unique id / root unique id',
      },
      {
        code: '100.100.303',
        description: 'card expired',
      },
      {
        code: '100.211.101',
        description: 'user account contains no or invalid Id',
      },
      {
        code: '100.300.300',
        description: 'invalid reference id',
      },
      {
        code: '100.350.200',
        description: 'undefined session state',
      },
      {
        code: '100.350.400',
        description:
          'no or invalid PIN (email/SMS/MicroDeposit authentication) entered',
      },
      {
        code: '100.370.111',
        description: 'system error( possible incorrect/missing input data)',
      },
      {
        code: '100.380.401',
        description: 'User Authentication Failed',
      },
      {
        code: '100.380.501',
        description: 'Risk management transaction timeout',
      },
      {
        code: '100.390.107',
        description:
          'Transaction rejected because cardholder authentication unavailable',
      },
      {
        code: '100.390.113',
        description: 'Unsupported User Device - Authentication not possible',
      },
      {
        code: '100.396.101',
        description: 'Cancelled by user',
      },
      {
        code: '100.396.104',
        description: 'Uncertain status - probably cancelled by user',
      },
      {
        code: '100.400.002',
        description: 'Transaction declined (Insufficient credibility score)',
      },
      {
        code: '100.400.007',
        description: 'System error ( possible incorrect/missing input data)',
      },
      {
        code: '100.400.304',
        description: 'invalid input data',
      },
      {
        code: '100.400.327',
        description: 'Risk report unsuccessful',
      },
      {
        code: '100.550.300',
        description: 'request contains no amount or too low amount',
      },
      {
        code: '100.550.301',
        description: 'amount too large',
      },
      {
        code: '100.550.310',
        description: 'amount exceeds limit for the registered account.',
      },
      {
        code: '100.550.401',
        description: 'invalid currency',
      },
      {
        code: '100.550.701',
        description: 'amounts not matched',
      },
      {
        code: '200.100.501',
        description: 'invalid or missing customer',
      },
      {
        code: '200.200.106',
        description:
          'duplicate transaction. Please verify that the UUID is unique',
      },
      {
        code: '200.300.404',
        description: 'invalid or missing parameter',
      },
      {
        code: '300.100.100',
        description:
          'Transaction declined (additional customer authentication required)',
      },
      {
        code: '500.100.201',
        description: 'Channel/Merchant is disabled (no processing possible)',
      },
      {
        code: '600.100.100',
        description:
          'Unexpected Integrator Error (Request could not be processed)',
      },
      {
        code: '600.200.201',
        description: 'Channel/Merchant not configured for this payment method',
      },
      {
        code: '600.200.400',
        description: 'Unsupported Payment Type',
      },
      //-------------
      //-------------
      {
        code: '600.200.500',
        description:
          'Invalid payment data. You are not configured for this currency or sub type (country or brand)',
      },
      {
        code: '600.200.600',
        description: 'invalid payment code (type or method)',
      },
      {
        code: '600.200.700',
        description:
          'invalid payment mode (you are not configured for the requested transaction mode)',
      },
      {
        code: '600.300.101',
        description: 'Merchant key not found',
      },
      {
        code: '700.100.500',
        description:
          'referenced payment currency does not match with requested payment currency',
      },
      {
        code: '700.400.200',
        description:
          'cannot refund (refund volume exceeded or tx reversed or invalid workflow?)',
      },
      {
        code: '700.400.520',
        description:
          'refund needs at least one successful transaction of type (CP or DB or RB or RC)',
      },
      {
        code: '700.400.570',
        description: 'cannot reference a waiting/pending transaction',
      },
      {
        code: '700.400.580',
        description: 'cannot find transaction',
      },
      {
        code: '700.500.003',
        description: 'test accounts not allowed in production',
      },
      {
        code: '800.100.100',
        description: 'transaction declined for unknown reason',
      },
      {
        code: '800.100.151',
        description: 'transaction declined (invalid card)',
      },
      {
        code: '800.100.152',
        description: 'transaction declined by authorization system',
      },
      {
        code: '800.100.155',
        description: 'transaction declined (amount exceeds credit)',
      },
      {
        code: '800.100.156',
        description: 'transaction declined (format error)',
      },
      {
        code: '800.100.157',
        description: 'transaction declined (wrong expiry date)',
      },
      {
        code: '800.100.158',
        description: 'transaction declined (suspecting manipulation)',
      },
      {
        code: '800.100.160',
        description: 'transaction declined (too many invalid tries)',
      },
      {
        code: '800.100.161',
        description: 'transaction declined (too many invalid tries)',
      },
      {
        code: '800.100.162',
        description: 'transaction declined (limit exceeded)',
      },
      {
        code: '800.100.163',
        description:
          'transaction declined (maximum transaction frequency exceeded)',
      },
      {
        code: '800.100.164',
        description: 'transaction declined (merchants limit exceeded)',
      },
      {
        code: '800.100.166',
        description:
          'transaction declined (Incorrect personal identification number)',
      },
      {
        code: '800.100.167',
        description:
          'transaction declined (referencing transaction does not match)',
      },
    ],
  },
];
