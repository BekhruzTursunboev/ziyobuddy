import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GROQ_API_KEY || "";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

interface GenerationConfig {
  max_tokens: number;
  temperature: number;
  top_p?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    console.log("API route called");
    const body = await request.json();
    const { prompt, config } = body;

    console.log("Prompt received:", prompt?.substring(0, 50));

    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid prompt provided");
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("GROQ"))
      );
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log("API Key length:", API_KEY.length);
    console.log("API Key prefix:", API_KEY.substring(0, 7) + "...");

    const generationConfig: GenerationConfig = {
      max_tokens: config?.max_tokens || 800,
      temperature: config?.temperature || 0.7,
      top_p: config?.top_p || 0.9,
    };

    const systemMessage: GroqMessage = {
      role: "system",
      content: `Siz ZiyoBuddy - o'zbek tilida javob beradigan professional, do'stona va interaktiv akademik yordamchi botsiz. 🎓

MUHIM QOIDALAR:
- Javobingiz QISQA, ANIQ va ILOJI BORicha TO'LIQ bo'lsin
- Asosiy ma'lumotlarni berib, ortiqcha tafsilotlardan saqlaning
- Ilmiy terminlardan foydalaning, lekin sodda tushunarli tilda tushuntiring
- Kod misollari kiritish mumkin (agar kerak bo'lsa)
- O'zbek tilida yozing
- Har doim ijobiy, rag'batlantiruvchi va motivatsion bo'ling
- Agar savol aniq bo'lmasa, qo'shimcha savollar bering
- Misollar va amaliy qo'llanishlar kiritishga harakat qiling
- Emojilar va formatlashdan foydalanib, javobni qiziqarli qiling`,
    };

    const userMessage: GroqMessage = {
      role: "user",
      content: `Savol: ${prompt}\n\nQisqa, aniq va foydali javob bering:`,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [systemMessage, userMessage],
            ...generationConfig,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: GroqResponse = await response.json();
          throw new Error(
            `API Error (${response.status}): ${
              errorData.error?.message || response.statusText
            }`
          );
        }

        const data: GroqResponse = await response.json();

        const generatedText = data.choices?.[0]?.message?.content?.trim();

        if (!generatedText) {
          throw new Error("No response generated from API");
        }

        return NextResponse.json({ response: generatedText });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof Error &&
          (error.name === "AbortError" ||
            (error.message.includes("400") && attempt === 1))
        ) {
          break;
        }

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt);
        }
      }
    }

    console.error("Groq API error after retries:", lastError);
    return NextResponse.json(
      {
        error:
          "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing. 🤔",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        error:
          "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing. 🤔",
      },
      { status: 500 }
    );
  }
}
