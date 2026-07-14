"use server";

import { Transaction } from "@/app/types/transaction";
import { findEmbedding } from "./embedding";
import { createAI } from "./instance";
import { usedModels } from "@/lib/utils";
import { Type } from "@google/genai";
import path from "path";
import os from "os";
import fs from "fs";

export async function generateChart(request: string) {
  const ai = createAI();
  const data = await findEmbedding(request, 0.5, 50);
  let contextData = "";
  if (!data || data.length === 0) {
    contextData =
      "No transactions found that are similar or relevant to the request";
  } else {
    contextData = data
      .map((trx: Transaction) => {
        return JSON.stringify(trx);
      })
      .join("\n");
  }
  const contents = {
    role: "user",
    parts: [
      {
        text: `
  <role>
    You are an AI Financial Analyst and Data Engineering Specialist. Your task is to analyst transactions in <context>and generate a structured JSON configuration to render charts that directly response the user's request.</context>. 
  </role>
  
  <input>
    User Request: "${request}"
  </input>

  <instructions>
  1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
  2. Grouping & Summarization: 
     - if the query is about expense type, group by category name.
     - if it's about time trend, group by date, day or month.
     - if it's comparing income and expenses, group by type.
    - limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, group smaller items into "Others" if necessary. 
    3. Values and Calculations : ensure all currency values are aggregated correctly. use positive number for visual chart representations 
    4. Chart Type Selection:
        - Use 'chartType: "pie"' if the users asks for proportions, ratios, percentage, or category composition.
        - Use 'chartType: "bar"' if the user asks for comparisons, over-time trends, chronological analysis or comparing individual entities.
  </instructions>

  <context>
    Current Date : ${new Date().toISOString()}
    Data Transaction: ${contextData}
  </context>

  <constraints>
    - Respond strictly with a raw and valid JSON object matching the requested schema.
    - DO NOT include markdown code blocks, backticks, or any conversational text. 
  </constraints> 
  `,
      },
    ],
  };
  const response = await ai.models.generateContent({
    model: usedModels,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chartType: {
            type: Type.STRING,
            enum: ["bar", "pie"],
            description: "Chart type to render",
          },
          data: {
            type: Type.ARRAY,
            description: "Array of object for data chart",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
              },
              required: ["name", "value"],
            },
          },
        },
        required: ["chartType", "data"],
      },
    },
  });
  if (!response.text) {
    throw new Error("Failed to generate chart!");
  }
  const chartData = JSON.parse(response.text);
  return chartData;
}

// generate image from gemini - PAID GEMINI ONLY!
export async function generateImage(request: string) {
  const ai = createAI();
  const data = await findEmbedding(request, 0.5, 50);
  let contextData = "";
  if (!data || data.length === 0) {
    contextData =
      "No transactions found that are similar or relevant to the request";
  } else {
    contextData = data
      .map((trx: Transaction) => {
        return JSON.stringify(trx);
      })
      .join("\n");
  }
  const contents = {
    role: "user",
    parts: [
      {
        text: `
        <role>
          You are an AI Financial Analyst and Data Illustrator. Your task is to analyst transactions in <context>and generate an image for infographic and conceptual dashboard in bento grid style that directly response the user's request.</context>. 
        </role>
        
        <input>
          User Request: "${request}"
        </input>

        <instructions>
        1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
        2. Grouping & Summarization: 
          - if the query is about expense type, group by category name.
          - if it's about time trend, group by date, day or month.
          - if it's comparing income and expenses, group by type.
          - limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, group smaller items into "Others" if necessary. 
          3. Values and Calculations : ensure all currency values are aggregated correctly. use positive number for visual chart representations 
          4. Create a visually outstanding bento-style design.
        </instructions>

        <context>
          Current Date : ${new Date().toISOString()}
          Data Transaction: ${contextData}
        </context>
  `,
      },
    ],
  };
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",
    contents,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Failed to generate image");
  }
  const parts = candidates[0].content?.parts;
  if (!parts) {
    throw new Error("Failed to generate image");
  }
  let base64Image = "";
  for (const part of parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      if (imageData) {
        base64Image = `data:${part.inlineData.mimeType || "image/png"};base64,${imageData}`;
      }
    }
  }
  return base64Image;
}

// generate video from gemini - PAID GEMINI ONLY!
export async function generateVideos(request: string) {
  const ai = createAI();
  const data = await findEmbedding(request, 0.5, 50);
  let contextData = "";
  if (!data || data.length === 0) {
    contextData =
      "No transactions found that are similar or relevant to the request";
  } else {
    contextData = data
      .map((trx: Transaction) => {
        return JSON.stringify(trx);
      })
      .join("\n");
  }
  const contents = `
        <role>
          You are an AI Financial Analyst and Motion Designer. Your task is to analyze transactions in <context> and generate a video for infographic and conceptual dashboard in bento grid style that directly response the user's request.</context>. 
        </role>
        
        <input>
          User Request: "${request}"
        </input>

        <instructions>
        1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
        2. Grouping & Summarization: 
          - if the query is about expense type, group by category name.
          - if it's about time trend, group by date, day or month.
          - if it's comparing income and expenses, group by type.
          - limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, group smaller items into "Others" if necessary. 
          3. Values and Calculations : ensure all currency values are aggregated correctly. use positive number for visual chart representations 
          4. Create a video outstanding with bento-style design.
          5. Maximum video duration is 10 seconds
        </instructions>

        <context>
          Current Date : ${new Date().toISOString()}
          Data Transaction: ${contextData}
        </context>
  `;
  let operation = await ai.models.generateVideos({
    model: "gemini-3.1-flash-image",
    prompt: contents,
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
      operation: operation,
    });
  }

  const generatedVideo = operation.response?.generatedVideos?.[0]?.video;
  if (!generatedVideo) {
    throw new Error("Failed to generate video");
  }

  const tempPath = path.join(os.tmpdir(), `temp-video-${Date.now()}.mp4`);
  await ai.files.download({
    file: generatedVideo,
    downloadPath: tempPath,
  });
  const videoBuffer = fs.readFileSync(tempPath);
  const base64Video = `data:${generatedVideo.mimeType || "video/mp4"};base64,${videoBuffer.toString("base64")}`;
  return base64Video;
}
