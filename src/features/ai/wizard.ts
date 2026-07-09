"use server";
import z from "zod";
import { createAI } from "./instance";
import { usedModels } from "@/lib/utils";
import { FunctionDeclaration, Type } from "@google/genai";
import { createTransaction } from "../transaction/action";

//CARA OTOMASI RESPONS AI SAAT CRUD VIA CHATBOT
const ai = createAI();
// buat dulu schema untuk validasi hasil AI nya
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
export async function handleWizardInput(message: string) {
  const contents = `${message}`;
  const response = await ai.models.generateContent({
    model: usedModels,
    // kalau mau modifikasi inputan user, maka pakai modifikasi contentsnya juga, berikut ini adalah contoh yang pakai XML karena lebih baik karena AI lebih tau
    // lebih baik define untuk instruksi pakai bahasa inggris, karena kalau pakai indonesia token lebih gede karena harus translate dulu
    // boleh di system instruction boleh di contents, contents ini ga ngemodifikasi conversation
    contents: `
    <role>
      You are an AI Wizard finance assistant, who can extract transaction details from text.
    </role>

    <instruction>
      Extract the transaction details from the following text and return it as a structured JSON object.
      The JSON object must have exactly these fields:
      - "amount": a number representing the cost  (positive). Use 0 if the amount is not provided
      - "type" : type of transaction, either 'income' or 'expense'. 
      - "category": choose the most appropriate category from this exact list: 
            "Education", "Food & Drink", "Transportation", "Entertainment", "Salary", "Others",
      - "description": a short string describing the transaction, first letter must be capitalized. 
      - "date": date of transaction in YYYY-MM-DD format. 
        Assume the current date if relative terms like 'today' or 'just now'. If the date is not define, use current date
    </instruction>

    <context>
      Current Date : ${new Date().toISOString()}
    </context>

    <input>
      Text to extract: ${contents} 
    </input>

    <outputFormat>
      Respond with only the raw JSON object, NO MARKDOWN BLOCKS, NO TEXT BEFORE OR AFTER
    </outputFormat>
    `,
    config: {
      // tipe yang dihasilkan itu berupa json
      responseMimeType: "application/json",
      // memasukkan transactionschema ke responseSchema dengan z.toJSONSchema (merubah zod schema ke json)
      responseSchema: z.toJSONSchema(transactionSchema),
    },
  });

  const transaction = transactionSchema.parse(JSON.parse(`${response.text}`));

  if (transaction.amount <= 0) {
    throw new Error("Cannot create transaction with invalid amount");
  }

  return transaction;
}

const createTransactionDeclaration: FunctionDeclaration = {
  name: "create_transaction", //format boleh snake_case atau camelCase
  description:
    "Create a new transaction in the user's financial history based on the provided details",
  // description tugasnya supaya model bisa tahu kapan fungsi ini dipanggil
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount of the transaction",
      },
      description: {
        type: Type.STRING,
        description: "A brief description of the transaction",
      },
      type: {
        type: Type.STRING,
        enum: ["income", "expense"],
        description: "Type of the transactions, either 'income' or 'expense'",
      },
      category: {
        type: Type.STRING,
        enum: [
          "Education",
          "Food & Drink",
          "Transportation",
          "Entertainment",
          "Salary",
          "Others",
        ],
        description: "Category of the transaction",
      },
      date: {
        type: Type.STRING,
        description: 'Date of the transaction in format "YYYY-MM-DD"',
      },
    }, // properties samakan dengan schema
    required: ["amount", "description", "type", "category", "date"],
  },
  //   parameters berupa json object schema
};

// Note: Tiap fungsi yang didaftarkan di handleWizardTools harus ada, bila user memanggil tidak spesifik, maka dianggap unknown function call atau error
export async function handleWizardTools(message: string) {
  const contents = `
    <role>
      You are an AI Wizard finance assistant, who can extract transaction details from text.
    </role>

    <instruction>
      Extract the transaction details from the following text.
    </instruction>

    <context>
      Current Date : ${new Date().toISOString()}
    </context>

    <input>
      Text to extract: ${message} 
    </input>
    `;

  const response = await ai.models.generateContent({
    model: usedModels,
    contents,
    config: {
      tools: [
        {
          functionDeclarations: [createTransactionDeclaration], //kalau ada fungsi2 lainnya, masukkan ke dalam arraynya
        },
      ],
    },
  });
  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionCall = response.functionCalls[0];
    switch (functionCall.name) {
      case "create_transaction":
        const args = functionCall.args;
        if (!args) {
          throw new Error("No arguments provided for create transaction");
        }
        // cekdulu schemanya dan parsing data
        const transaction = transactionSchema.parse(args);
        if (transaction.amount <= 0) {
          throw new Error("Cannot create transaction with invalid amount");
        }
        await createTransaction(transaction);
        break;
      default:
        throw new Error("Unknown function call");
    }
  } else {
    throw new Error("AI did not call any function");
  }
}
