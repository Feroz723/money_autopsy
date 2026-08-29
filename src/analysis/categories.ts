import type { NormalizedTransaction } from "../ingestion/types.js";
import { extractMerchant } from "./merchants.js";
import type { CategoryClassification, CategoryName, CategorySummary } from "./types.js";

const KEYWORD_MAP: [CategoryName, string[]][] = [
  ["Food & Dining", ["swiggy", "zomato", "restaurant", "food", "cafe", "coffee", "tea", "dining", "dominos", "pizza", "burger", "biryani", "bakery", "kitchen", "canteen", "mess"]],
  ["Shopping", ["amazon", "flipkart", "myntra", "shop", "mall", "store", "mart", "meesho", "ajio"]],
  ["Transport", ["uber", "ola", "metro", "fuel", "petrol", "diesel", "cab", "auto", "rapido", "parking", "toll"]],
  ["Bills & Utilities", ["electricity", "mobile", "recharge", "broadband", "water", "gas", "postpaid", "prepaid", "airtel", "jio", " vi ", "vodafone", "bsnl", "wifi"]],
  ["Entertainment", ["netflix", "spotify", "youtube", "hotstar", "prime video", "movie", "cinema", "gaming", "disney"]],
  ["Health", ["pharmacy", "hospital", "doctor", "medical", "apollo", "diagnostic", "lab", "health", "clinic", "pharma"]],
  ["Education", ["school", "college", "university", "course", "tuition", "udemy", "coursera", "book"]],
  ["Travel", ["hotel", "flight", "airline", "irctc", "train", "makemytrip", "goibibo", "booking", "oyo"]],
  ["Financial", ["insurance", "premium", "mutual fund", "sip", "emi", "loan", "interest"]],
  ["Personal", ["salon", "spa", "gym", "fitness", "grooming"]],
  ["Transfers", ["self transfer", "own account", "trf to self", "trf from self", "internal transfer", "fund transfer"]],
];

export function classifyTransaction(transaction: NormalizedTransaction): CategoryClassification {
  const merchant = extractMerchant(transaction.description);
  const text = `${merchant} ${(transaction.description ?? "").toLowerCase()}`;

  for (const [category, keywords] of KEYWORD_MAP) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return { category, confidence: "high", reason: `matched keyword '${keyword}'` };
      }
    }
  }

  return { category: "Other", confidence: "low", reason: "no keyword match" };
}

export function calculateCategorySpending(transactions: NormalizedTransaction[]): CategorySummary[] {
  const groups = new Map<CategoryName, { total: bigint; count: number }>();
  let totalSpending = 0n;

  for (const t of transactions) {
    if (t.debit === null) continue;
    totalSpending += t.debit;
    const { category } = classifyTransaction(t);
    const group = groups.get(category) ?? { total: 0n, count: 0 };
    group.total += t.debit;
    group.count += 1;
    groups.set(category, group);
  }

  return [...groups.entries()]
    .map(([category, g]) => ({
      category,
      totalSpending: g.total,
      transactionCount: g.count,
      percentOfTotal: totalSpending === 0n ? null : Number((g.total * 10000n) / totalSpending) / 100,
    }))
    .sort((a, b) => (b.totalSpending > a.totalSpending ? 1 : b.totalSpending < a.totalSpending ? -1 : 0));
}
