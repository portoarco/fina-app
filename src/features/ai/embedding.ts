"use server";

import { Conversation } from "@/app/types/ai";
import { createAI } from "./instance";
import { createClient } from "@/lib/supabase/server";
import { Transaction } from "@/app/types/transaction";

export async function generateEmbedding(contents: string) {
  const ai = createAI();
  const usedModels = "gemini-embedding-2";
  //   const usedModels ="gemini-embedding-001"
  try {
    const response = await ai.models.embedContent({
      model: usedModels,
      contents: contents,
      config: {
        // outputDimensionality cek dari dokumentasi
        outputDimensionality: 768,
      },
    });
    if (
      !response.embeddings ||
      response.embeddings.length === 0 ||
      !response.embeddings[0].values
    )
      throw new Error("Failed to generate embeddings");

    return response.embeddings[0].values;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// retrieve embedding  = ngambil embedding
export async function generateContentfromQueryEmbedding(
  query: string,
  historyChat?: Conversation[],
  isThinking?: boolean,
) {
  const ai = createAI();
  const supabase = await createClient();

  // embedding query yang diinput user dan dicocokkan / match dengan data di vector db
  const queryEmbedding = await generateEmbedding(query);
  // match_transactions = fungsi untuk matching
  const { data, error } = await supabase.rpc("match_transactions", {
    queryEmbedding: queryEmbedding,
    // match threshold rangenya dari 0-1
    match_threshold: 0.3,
    // match_count  = jumlah yang mungkin jadi limit untuk chunk
    match_count: 15,
  });
  if (error) {
    throw new Error("Failed to perform vector search");
  }
  let contextData = "";
  if (!data || data.length === 0) {
    contextData =
      "No transactions found that are similar or relevant to the questions";
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join("\n");
  }
}
