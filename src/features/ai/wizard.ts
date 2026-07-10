"use server";
import { usedModels } from "@/lib/utils";
import z from "zod";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "../transaction/action";
import { findEmbedding } from "./embedding";
import {
  createTransactionDeclaration,
  deleteTransactionDeclaration,
  getTransactionDeclaration,
  updateTransactionDeclaration,
} from "./functionTransaction";
import { createAI } from "./instance";
import { Content } from "@google/genai";

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
  await createTransaction(transaction);

  // return transaction;
  return "Create transaction success";
}

// Note: Tiap fungsi yang didaftarkan di handleWizardTools harus ada, bila user memanggil tidak spesifik, maka dianggap unknown function call atau error
export async function handleWizardTools(message: string) {
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: `
    <role>
      You are an AI Wizard finance assistant, who can extract transaction details from text.
    </role>

    <instruction>
      - Extract the transaction details from the following text. 
      - If request is to update or delete transaction, you must call function get_transaction first to find out which transaction will be updated or deleted.
      - When update transaction, args must return from get_transaction before with fully like in schema.
      - The final response if there are no more functions being called is as simple as possible .
    </instruction>

    <context>
      Current Date : ${new Date().toISOString()}
    </context>

    <input>
      Text to extract: ${message} 
    </input>
    `,
        },
      ],
    },
  ];
  let iterate = 1;
  let running = true; //nilai awal iterasi masih running dan call ai berkali-kali sampai tugasnya selesai
  // selama runing maka jalankan :

  while (running) {
    console.log(`iterate: ${iterate}`);
    console.log(contents);
    iterate++;
    const response = await ai.models.generateContent({
      model: usedModels,
      contents,
      config: {
        tools: [
          {
            functionDeclarations: [
              getTransactionDeclaration,
              createTransactionDeclaration,
              deleteTransactionDeclaration,
              updateTransactionDeclaration,
            ], //kalau ada fungsi2 lainnya, masukkan ke dalam arraynya
          },
        ],
      },
    });
    if (response.functionCalls && response.functionCalls.length > 0) {
      // const functionCall = response.functionCalls[0];
      // const functionCall = response.functionCalls;
      // console.log(functionCall);

      // Supaya bisa terima lebih dari 1 data, maka perlu di mapping dengan cara berikut:
      console.log(response.functionCalls);

      if (response.candidates && response.candidates[0]?.content) {
        contents.push(response.candidates[0].content);
      }

      const functionResponseParts = await Promise.all(
        response.functionCalls.map(async (functionCall) => {
          const { name, args, id } = functionCall;
          if (!args) {
            throw new Error("No arguments provided for action");
          }
          let resultData = {};
          switch (name) {
            case "get_transaction":
              const dataFind = await findEmbedding(
                JSON.stringify(args),
                0.3,
                1,
              );
              resultData = dataFind[0] || {};
              break;
            case "create_transaction":
              // cekdulu schemanya dan parsing data
              const transaction = transactionSchema.parse(args);
              if (transaction.amount <= 0) {
                throw new Error(
                  "Cannot create transaction with invalid amount",
                );
              }
              await createTransaction(transaction);
              break;
            case "delete_transaction":
              // // karena AI bisa halusinasi misal tidak ada transaksi malah ngebuat transaksi sendiri, maka perlu untuk dibuatkan vector search
              // // PENCARIAN VEKTOR
              // const dataFindForDelete = await findEmbedding(
              //   JSON.stringify(args),
              //   0.95,
              //   1,
              // );
              // // args di stringify dulu diubah bentuk embedding
              // const deletedData = dataFindForDelete[0];

              // if (!deletedData) {
              //   throw new Error("Data Not Found");
              // }
              // await deleteTransaction(deletedData.id);
              // // pada bagian delete data ini benar-benar harus di cek dari match_threshold, match_count supaya data yang didelete itu sesuai, otak atik untuk params di functionnya itu
              // break;
              await deleteTransaction(`${args.id}`);
              break;
            case "update_transaction":
              // const dataFindForUpdate = await findEmbedding(
              //   JSON.stringify(args),
              //   0.3,
              //   1,
              // );
              // const updateData = dataFindForUpdate[0];
              // if (!updateData) {
              //   throw new Error("Data Not Found");
              // }
              // Cek Schema newData
              const newData = transactionSchema.parse(args);
              if (newData.amount <= 0) {
                throw new Error(
                  "Cannot update transaction with invalid amount",
                );
              }
              await updateTransaction(`${args.id}`, newData);
              break;
            default:
              throw new Error("Unknown function call");
          }
          return {
            functionResponse: {
              name,
              response: { result: resultData },
              id,
            },
          };
        }),
      );

      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    } else {
      running = false;
      return response.text;
    }
  }
}
