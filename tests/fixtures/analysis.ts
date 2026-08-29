import type { NormalizedTransaction } from "../../src/ingestion/types.js";

/** 4 months of fictional transactions for analysis tests. */
function tx(
  date: string,
  description: string | null,
  debit: bigint | null,
  credit: bigint | null,
  balance: bigint | null = null,
  reference: string | null = null,
): NormalizedTransaction {
  return { date, description, debit, credit, balance, reference, source: "generic" };
}

export const analysisTransactions: NormalizedTransaction[] = [
  // ── January 2026 ──
  tx("2026-01-01", "NEFT CR-FICTIONAL EMPLOYER-JAN SALARY", null, 5_000_000n, 5_000_000n),
  tx("2026-01-03", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000001-FOOD ORDER", 25_000n, null, 4_975_000n),
  tx("2026-01-05", "UPI-UBER INDIA-uber@upi-ICIC0000002-RIDE", 15_000n, null, 4_960_000n),
  tx("2026-01-07", "NETFLIX SUBSCRIPTION", 64_900n, null, 4_895_100n),
  tx("2026-01-07", "SPOTIFY PREMIUM", 11_900n, null, 4_883_200n),
  tx("2026-01-10", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000005-DINNER", 35_000n, null, 4_848_200n),
  tx("2026-01-12", "ELECTRICITY BILL PAYMENT", 180_000n, null, 4_668_200n),
  tx("2026-01-15", "UPI-AMAZON PAY-amazon@upi-ONLINE SHOPPING", 250_000n, null, 4_418_200n),
  tx("2026-01-18", "UPI-ZOMATO-zomato@upi-HDFC0000003-LUNCH", 18_000n, null, 4_400_200n),
  tx("2026-01-20", "SELF TRANSFER TO SAVINGS", 500_000n, null, 3_900_200n),
  tx("2026-01-25", "UPI-UNKNOWN MERCHANT-xyz@upi-MISC", 5_000n, null, 3_895_200n),

  // ── February 2026 ──
  tx("2026-02-01", "NEFT CR-FICTIONAL EMPLOYER-FEB SALARY", null, 5_000_000n, 8_895_200n),
  tx("2026-02-03", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000010-FOOD ORDER", 22_000n, null, 8_873_200n),
  tx("2026-02-05", "UPI-OLA CABS-ola@upi-RIDE", 12_000n, null, 8_861_200n),
  tx("2026-02-07", "NETFLIX SUBSCRIPTION", 64_900n, null, 8_796_300n),
  tx("2026-02-07", "SPOTIFY PREMIUM", 11_900n, null, 8_784_400n),
  tx("2026-02-10", "UPI-FLIPKART-flipkart@upi-SHOPPING", 180_000n, null, 8_604_400n),
  tx("2026-02-12", "ELECTRICITY BILL PAYMENT", 195_000n, null, 8_409_400n),
  tx("2026-02-14", "UPI-ZOMATO-zomato@upi-HDFC0000003-VALENTINES DINNER", 45_000n, null, 8_364_400n),
  tx("2026-02-20", "MOBILE RECHARGE AIRTEL", 59_900n, null, 8_304_500n),
  tx("2026-02-22", "UPI-UBER INDIA-uber@upi-ICIC0000002-RIDE", 18_000n, null, 8_286_500n),
  tx("2026-02-25", null, 8_000n, null, 8_278_500n, "MISC-REF-001"),

  // ── March 2026 ──
  tx("2026-03-01", "NEFT CR-FICTIONAL EMPLOYER-MAR SALARY", null, 5_200_000n, 13_478_500n),
  tx("2026-03-02", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000020-FOOD", 28_000n, null, 13_450_500n),
  tx("2026-03-05", "UPI-UBER INDIA-uber@upi-ICIC0000002-RIDE", 14_000n, null, 13_436_500n),
  tx("2026-03-07", "NETFLIX SUBSCRIPTION", 64_900n, null, 13_371_600n),
  tx("2026-03-07", "SPOTIFY PREMIUM", 11_900n, null, 13_359_700n),
  tx("2026-03-10", "APOLLO PHARMACY MEDICAL", 350_000n, null, 13_009_700n),
  tx("2026-03-12", "ELECTRICITY BILL PAYMENT", 210_000n, null, 12_799_700n),
  tx("2026-03-15", "UPI-DOMINOS-dominos@upi-PIZZA ORDER", 45_000n, null, 12_754_700n),
  tx("2026-03-18", "IRCTC TRAIN TICKET BOOKING", 125_000n, null, 12_629_700n),
  tx("2026-03-20", "FUND TRANSFER TO OTHER ACCOUNT", 200_000n, null, 12_429_700n),
  tx("2026-03-25", "IMPS CR-FICTIONAL REFUND-ORDER 123456", null, 50_000n, 12_479_700n),

  // ── April 2026 ──
  tx("2026-04-01", "NEFT CR-FICTIONAL EMPLOYER-APR SALARY", null, 5_200_000n, 17_679_700n),
  tx("2026-04-02", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000030-FOOD", 30_000n, null, 17_649_700n),
  tx("2026-04-03", "UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000031-SNACKS", 12_000n, null, 17_637_700n),
  tx("2026-04-05", "UPI-UBER INDIA-uber@upi-ICIC0000002-RIDE", 16_000n, null, 17_621_700n),
  tx("2026-04-07", "NETFLIX SUBSCRIPTION", 64_900n, null, 17_556_800n),
  tx("2026-04-07", "SPOTIFY PREMIUM", 11_900n, null, 17_544_900n),
  tx("2026-04-10", "SAMSUNG GALAXY PURCHASE", 4_500_000n, null, 13_044_900n),
  tx("2026-04-12", "ELECTRICITY BILL PAYMENT", 175_000n, null, 12_869_900n),
  tx("2026-04-15", "UPI-ZOMATO-zomato@upi-HDFC0000003-LUNCH", 22_000n, null, 12_847_900n),
  tx("2026-04-18", "SALON GROOMING", 80_000n, null, 12_767_900n),
  tx("2026-04-20", "GYM FITNESS MONTHLY", 150_000n, null, 12_617_900n),
];
