"use server";

import { Conversation } from "@/app/types/ai";

import { usedModels } from "@/lib/utils";
import { Content, FunctionCall, Part } from "@google/genai";
import { findEmbedding } from "./embedding";
import { getTransactionDeclaration } from "./functionTransaction";
import { createAI } from "./instance";

// define dulu ai nya
// const ai = new GoogleGenAI({ apiKey: ENV.googleGenAIKey });
// api key ambil dari google ai studio
const ai = createAI();

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

  const response = await ai.models.generateContent({
    model: usedModels,
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

// function untuk general dan personalized chat streaming
async function generalChat(conversation: Content[], isThinking: boolean) {
  const response = await ai.models.generateContentStream({
    // generate content stream biasanya dipakai kalo mau ada ui dimana harus nunggu dulu atau generate satu per satu seperti chat
    model: usedModels,
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
      - Kalau user tanya terkait pengeluaran atau pendapatan atau data yang terkait analisis miliknya, arahkan untuk memilih opsi "Personal" pada pilihan opsi AI

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
  return response;
}

// async function* personalizedChat(
//   query: string,
//   historyChat?: Content[],
//   isThinking?: boolean,
// ) {}

// PERSONALIZED STREAMING CHAT - RAG IMPLEMENTATION
// retrieve embedding  = ngambil embedding
export async function* handleChatStreaming(
  conversation: Content[],
  isThinking: boolean,
  mode: "general" | "personalized",
) {
  if (mode === "general") {
    const response = await generalChat(conversation, isThinking);
    if (isThinking) {
      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (!part.text) {
              continue;
            } else if (part.thought) {
              yield `[thought]${part.text}`;
            } else {
              yield part.text;
            }
          }
        }
      }
    } else {
      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }
  } else {
    const query = conversation[conversation.length - 1]?.parts?.[0]?.text;
    const historyChat = conversation.slice(0, -1);

    let contents: Content[] = [
      ...historyChat,
      {
        role: "user",
        parts: [
          {
            text: `
  <role>
    You are an AI Financial Analyst. You are helping the user analyze their financial data. 
  </role>
  
  <input>
    User Question: "${query}"
  </input>

  <instructions>
  - Extract the transaction details from user input.
    - Answer the user question ONLY based on the relevant transaction data (if there's need data).
    - If there are calculations (total spending, average, etc), calculate them accurately based on data
    - Provide the answer in a neat, professional, yet easy-to-understand markdown format. 
    - If there is irrelevant data at all, state that the data is not available in the data's history. 
    - If user question is general and not need a data, response generally.
    - The final response if there are no more functions being called is as simple as possible 
  </instructions>

  <context>
    Current Date : ${new Date().toISOString()}
  </context>

  <constraints>
    - Answer in relaxed, polite but professional in Bahasa Indonesia.
    - Don't make any assumptions about user's data if they don't mention it.
    - If there are questions outside the context related to finance (creating code/programming stuffs, private relationships, love matters, non-finance psychology, answering school quizz, etc), DON'T ANSWER! You must only answer questions related to finance. 
    - Don't answer in table format instead of markdown,
  </constraints> 
  `,
          },
        ],
      },
    ];

    let running = true;
    let iterate = 1;
    while (running) {
      iterate++;
      console.log(`iterate: ${iterate}`);
      console.log(contents);
      const response = await ai.models.generateContentStream({
        model: usedModels,
        contents,
        config: {
          tools: [{ functionDeclarations: [getTransactionDeclaration] }],
          thinkingConfig: {
            includeThoughts: isThinking,
          },
        },
      });

      const modelParts: Part[] = [];
      const functionCalls: FunctionCall[] = [];
      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        if (parts) {
          for (const part of parts) {
            modelParts.push(part);
            if (part.functionCall) {
              functionCalls.push(part.functionCall);
            } else if (part.text) {
              if (part.thought) {
                if (isThinking) yield `[thought]${part.text}`;
              } else {
                yield part.text;
              }
            }
          }
        }
      }
      if (functionCalls.length > 0) {
        contents.push({ role: "model", parts: modelParts });
        console.log(functionCalls);
        const functionResponseParts = await Promise.all(
          functionCalls.map(async (functionCall) => {
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
                  100,
                );
                resultData = dataFind[0] || [];
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
      }
    }
  }
}
