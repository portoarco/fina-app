"use server";

import { createAI } from "./instance";

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
