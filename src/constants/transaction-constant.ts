import z from "zod";

export const CATEGORIES = [
  "Education",
  "Food & Drink",
  "Transportation",
  "Entertainment",
  "Salary",
  "Others",
];

export // buat dulu schema untuk validasi hasil AI nya
const transactionSchema = z.object({
  amount: z.number().default(0).describe("Transaction nominal"),
  // describe untuk mendeskripsikan amount itu buat apa
  type: z
    .enum(["income", "expense"], {
      error: "Type is required",
    })
    .describe("Type of transaction"),
  category: z
    .enum([
      "Education",
      "Food & Drink",
      "Transportation",
      "Entertainment",
      "Salary",
      "Others",
    ])
    .describe("Category of transaction"),
  // describe boleh pakai bahasa indonesia atau inggris menyesuaikan kebutuhan
  date: z.string().describe("the date of transaction in YYYY-MM-DD format"),
  description: z.string().describe("Short text for describing transaction"),
});
