"use server";

import { createClient } from "@/lib/supabase/server";
import { createAI } from "./instance";
import { Transaction } from "@/app/types/transaction";

export async function generateEmbedding(contents: string) {
  const ai = createAI();
  const usedEmbeddingModels = "gemini-embedding-2";
  //   const usedEmbeddingModels ="gemini-embedding-001"
  try {
    const response = await ai.models.embedContent({
      model: usedEmbeddingModels,
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

export async function findEmbedding(
  query: string,
  match_threshold?: number,
  match_count?: number,
) {
  const supabase = await createClient();
  // embedding query yang diinput user dan dicocokkan / match dengan data di vector db
  const queryEmbedding = await generateEmbedding(query);
  // match_transactions = fungsi untuk matching
  const { data, error } = await supabase.rpc("match_transactions", {
    // key harus sama (sebelah kiri) dengan data dalam database, dan value sama dengan data const di atas
    query_embedding: queryEmbedding,
    // match threshold rangenya dari 0-1, batas minimal diterima
    match_threshold: match_threshold || 0.3,
    // match_count  = jumlah yang mungkin jadi limit untuk chunk
    match_count: match_count || 15,
  });
  if (error) {
    throw new Error("Failed to perform vector search");
  }

  return data;
}
