import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { appConfig } from "@/config/app-config";

const HistoryMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AskInput = z.object({
  question: z.string().min(1).max(2000),
  contexts: z
    .array(
      z.object({
        docName: z.string(),
        page: z.number().int().positive(),
        text: z.string(),
      }),
    )
    .max(12),
  history: z.array(HistoryMessage).max(20).default([]),
});

const NO_ANSWER = "I couldn't find this information in the uploaded documents.";

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AskInput.parse(data))
  .handler(async ({ data }) => {
    if (data.contexts.length === 0) {
      return { answer: NO_ANSWER, model: appConfig.openrouter.model };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key is not configured. Add OPENROUTER_API_KEY in Project Settings.",
      );
    }

    const contextBlock = data.contexts
      .map(
        (c, i) =>
          `[Source ${i + 1} — "${c.docName}", page ${c.page}]\n${c.text}`,
      )
      .join("\n\n");

    const system = [
      "You are a precise document question-answering assistant.",
      "You must answer using ONLY the information in the provided context.",
      `If the answer is not contained in the context, reply EXACTLY with: "${NO_ANSWER}"`,
      "Do not use outside knowledge. Do not speculate.",
      "Be concise, accurate, and neutral. Prefer bullet points for lists.",
      "Cite supporting sources inline like [Source 1], [Source 2] where relevant.",
    ].join(" ");

    const userMessage = `Context:\n${contextBlock}\n\nQuestion: ${data.question}`;

    let response: Response;
    try {
      response = await fetch(`${appConfig.openrouter.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Document Q&A",
        },
        body: JSON.stringify({
          model: appConfig.openrouter.model,
          temperature: appConfig.openrouter.temperature,
          max_tokens: appConfig.openrouter.maxTokens,
          messages: [
            { role: "system", content: system },
            ...data.history,
            { role: "user", content: userMessage },
          ],
        }),
      });
    } catch (err) {
      throw new Error(
        `Network error while contacting OpenRouter: ${(err as Error).message}`,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `OpenRouter request failed (${response.status}): ${detail.slice(0, 240)}`,
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      answer: answer.length > 0 ? answer : NO_ANSWER,
      model: appConfig.openrouter.model,
    };
  });