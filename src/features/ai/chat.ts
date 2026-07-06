"use server";

import { Conversation } from "@/app/types/ai";
import z from "zod";
import { createAI } from "./instance";

// define dulu ai nya
// const ai = new GoogleGenAI({ apiKey: ENV.googleGenAIKey });
// api key ambil dari google ai studio
const ai = createAI();

// model: "gemini-2.5-flash",
// model: "gemini-3-flash-preview",
// model: "gemini-3.1-flash-lite",
// model: "gemini-3.1-flash-live-preview",
// model: "gemini-3.5-flash",
const usedModels = "gemini-3.1-flash-lite";
// contoh fungsi statis
// export async function handleChat() {
//   //   contoh dengan generate content
//   const response = await ai.models.generateContent({
//     // model adalah model ai yang mau digunakan, cari di docs/gemini-api models, contoh skrg dengan 3, kalo kena limit ganti manual untuk modelnya
//     model: "gemini-3-flash-preview",
//     // contents isinya tempat untuk prompting
//     contents: "Kamu itu siapa se",
//     config: {},
//   });
//   console.log(response.text);
//   return response.text;
// }

// VERSI TERKONEKSI UTK TEXT GENERATION
export async function handleChat(
  conversation: Conversation[],
  isThinking: boolean,
) {
  // untuk generateContent itu hanya untuk teks yang 1 kali bikin aja
  // model: "gemini-3-flash-preview" : model awal,
  const response = await ai.models.generateContent({
    // model: "gemini-2.5-flash",
    // model: "gemini-3-flash-preview",
    model: usedModels,
    // model: "gemini-3.1-flash-live-preview",
    // model: "gemini-3.5-flash",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
      },
    },
  });
  //   const response = await ai.interactions.create({
  //     model: "gemini-2.5-flash",
  //     input: message,
  //   });

  //   fitur baru ada yang dengan ai.models. interaction, cek dokumentasi

  // SWITCH THINKING
  const result = {
    thoughts: "",
    answer: "",
  };
  if (isThinking) {
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return;
    }

    for (const part of parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        result.thoughts += part.text;
      } else {
        result.answer += part.text;
      }
    }
  } else {
    result.answer = `${response.text}`;
  }

  return result;
}

// THINKING MODE
// export async function handleChatWithThinking(message: string) {
//   const response = await ai.models.generateContent({
//     model: "gemini-3.5-flash",
//     contents: message,
//     config: {
//       thinkingConfig: {
//         // thinkingBudget untuk pengaturan budget, tiap model beda, cek dokumentasi
//         // thinkingBudget: 0, //tanpa thinking sama sekali
//         // thinkingLevel: ThinkingLevel.MINIMAL,
//         // untuk jenis thinking level bisa cek dokumentasi google gemini
//         includeThoughts: true,
//         // includeThoughts untuk buat ringkasan pemikiran, cara jalan pikiran
//       },
//     },
//   });
//   //   cara untuk tampilkan alur pemikiran
//   const parts = response.candidates?.[0]?.content?.parts;
//   if (!parts) {
//     return;
//   }
//   const result = {
//     thoughts: "",
//     answer: "",
//   };
//   for (const part of parts) {
//     if (!part.text) {
//       continue;
//     } else if (part.thought) {
//       result.thoughts += part.text;
//     } else {
//       result.answer += part.text;
//     }
//   }

//   return result;
// }

// STREAMING RESPONSE
export async function* handleChatStreaming(
  // message: string,
  conversation: Conversation[],
  isThinking: boolean,
) {
  // tanda bintang * pada function itu adalah ciri dari generator function
  const response = await ai.models.generateContentStream({
    // generate content stream biasanya dipakai kalo mau ada ui dimana harus nunggu dulu atau generate satu per satu seperti chat
    // model: "gemini-2.5-flash",
    // model: "gemini-3-flash-preview",
    model: usedModels,
    // model: "gemini-3.1-flash-live-preview",
    // model: "gemini-3.5-flash",

    // contents: message,
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },
      // tambahkan systemInstruction untuk prompter instruksi yang diberikan ke AI untuk merespons user
      systemInstruction: `
      [Role]
      Kamu adalah FinaBotz seorang  financial advisor yang akan menjawab pertanyaan user. Finaboltz punya gaya bahasa sopan dan suka memberikan analogi penjelasan dengan kehidupan sehari-hari agar penjelasan rumit jadi lebih mudah dipahami dengan bahasa sederhana.

      [Context]
      Kamu bekerja untuk Fina, sebuah platform financial tracker yang target segmentasi utamanya adalah Gen Z di Indonesia usia 18-30 tahun dengan penghasilan UMR (Rp 3.000.000 - Rp 6.000.000) kebanyakan dari mereka mengalami FOMO, gaya hidup konsumtif dan tidak memikirkan dana darurat maupun investasi. 

      [Instructions]
      - Jawab semua pertanyaan yang sesuai dengan bidang finance 

      [Input]
      Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dan darurat atau pertanyaan lain seputar finance

      [Constraints]
      - Jawab dengan bahasa Indonesia yang santai, sopan namun tetap profesional layaknya certified senior profesional financial advisor.
      - Jangan membuat asumsi tentang data dari pengguna jika mereka tidak menyebutkannya.
      - Jika ada pertanyaan diluar konteks terkait finance, maka kamu jawab bahwa kamu hanya bisa menjawab pertanyaan terkait finance

      [Workflow Steps]
      - Langkah 1 (Information Extraction): Identifikasi pengguna, tanyakan usia, penghasilan atau budget, dan tujuan keuangan
      - Langkah 2 (Thought): Analisis masalah utama pengguna dan data apa yang kurang.
      - Langkah 3 (Action): Tentukan rencana yang harus dijalankan.
      - Langkah 4 (Evaluation): Periksa kembali hasil dari action.
      - Langkah 5 (Response Generation): Keluarkan jawaban akhir ke pengguna.

      [Response Format]
      Struktur jawaban kamu harus seperti ini: 
      1. Analisis singkat masalah pengguna dalam 1 kalimat 
      2. Langkah solusi menggunakan bullet points. 

      [Example]
      Ikuti gaya jawaban dari contoh berikut:

      [Contoh 1]
      User:"Gaji saya 5 juta, gimana cara nabung dana darurat"
      Model:"Mengumpulkan dana darurat dengan gaji 5 juta itu sangat mungkin, asalkan konsiste. Berikut langkah awalnya:
      - Sisihkan minimal 10% di awal bulan.
      - Simpan di instrumen rendah resiko, seperti RDPU"
      
      [Contoh 2]
      User : "mending bayar utang paylater atau mulai investas"
      model: "prioritas utama yang sehat adalah melunasi utang konsumtif dengan bunga tinggi. Ini saran untukmu:
      - Stop penggunaan paylater untuk sementara waktu.
      - Dana berlebih pakai untuk melunasi paylater tersebut karena bunga jauh lebih tinggi dari imbal hasil investasi
      - Setelah lunas baru mulai rutin investasi 
      `,

      // Contoh format akhir jawab:
      // "...pastikan dana darurat aman [Selesai]."
      // sampling params
      temperature: 0.2,
      topK: 5,
      topP: 0.1,
      // output control
      maxOutputTokens: 2048, //1024,
      // biasanay di 1024 itu sudah sangat cukup, dan mencegah bot untuk menulis solusi yang terlalu panjang
      stopSequences: ["\n\n\n", "###", "User:", "Pengguna:"],
      // \n\n\n untuk mencegah model menulis paragraf kosong atau mengulang teks yang sama/ looping
      //  ### adalah markdown header, dan bot harus berhenti supaya tidak membuat bagian baru diluar dari yang diprompt/instruksikan
      // "User" dan "Pengguna" itu perlu untuk distop, supaya model tidak perlu untuk beracting seolah-olah sebagai user atau pengguna, dan buat pertanyaan utk dirinya sendiri, bot harus dipotong sebelum niru
      // "[Selesai]" sbg penanda supaya memperintahkan model utk mengakhiri respons shg API berhenti distribusikan token, perlu kasih tanda di sistem instructions, tapi biasanya jadi kurang natural

      // --- Repetition penalties - mengontrol pengulangan kata (hanya bisa di gemini berbayar)
      // presencePenalty: 1.5,
      // frequencyPenalty: 1.5,
    },
  });
  if (isThinking) {
    for await (const chunk of response) {
      // pecah part dan cek satu satu
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        // kalo ada maka cek satu satu
        for (const part of parts) {
          if (!part.text) {
            continue;
          } else if (part.thought) {
            // karena yield cuman kirim teks aja, maka harus dikasih flagging supaya bisa dikirim sebagai though
            yield `[thought]${part.text}`;
          } else {
            yield part.text;
          }
        }
      }
    }
  } else {
    // pecah-pecah responsenya dengan konsep "chunk"
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
        // yield itu di javascript modelnya distop sementara dulu dan melanjutkan eksekusi, kalau return langsung diakhiri eksekusinya
      }
    }
  }
}

//CARA OTOMASI RESPONS AI SAAT CRUD VIA CHATBOT

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
