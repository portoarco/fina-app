"use server";

import { Conversation } from "@/app/types/ai";
import { ENV } from "@/config/environment";
import { GoogleGenAI } from "@google/genai";

// define dulu ai nya
const ai = new GoogleGenAI({ apiKey: ENV.googleGenAIKey });
// api key ambil dari google ai studio

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
    model: "gemini-3-flash-preview",
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
    model: "gemini-3.5-flash",
    // contents: message,
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },
      // tambahkan systemInstruction untuk prompter instruksi yang diberikan ke AI untuk merespons user
      systemInstruction: `Kamu adalah seorang senior financial advisor yang akan menjawab pertanyaan user`,
      // sampling params
      temperature: 0.2,
      topK: 5,
      topP: 0.1,
      // output control
      maxOutputTokens: 100,
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
