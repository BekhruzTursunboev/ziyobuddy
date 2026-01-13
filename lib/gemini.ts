const API_KEY = "AIzaSyCh4gJKCbKn-B732obXrxdYAoRvEuLphSs";
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface GenerationConfig {
  maxOutputTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Delays execution for a specified amount of time
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates an academic response using Google Gemini API
 * @param prompt - The user's question or prompt
 * @param config - Optional generation configuration
 * @returns Promise<string> - The generated response
 */
export async function generateAcademicResponse(
  prompt: string,
  config: Partial<GenerationConfig> = {}
): Promise<string> {
  const generationConfig: GenerationConfig = {
    maxOutputTokens: config.maxOutputTokens || 800,
    temperature: config.temperature || 0.7,
    topP: config.topP || 0.9,
    topK: config.topK || 40,
  };

  const systemPrompt = `Siz ZiyoBuddy - o'zbek tilida javob beradigan professional, do'stona va interaktiv akademik yordamchi botsiz. 🎓

MUHIM QOIDALAR:
- Javobingiz QISQA, ANIQ va ILOJI BORicha TO'LIQ bo'lsin
- Asosiy ma'lumotlarni berib, ortiqcha tafsilotlardan saqlaning
- Ilmiy terminlardan foydalaning, lekin sodda tushunarli tilda tushuntiring
- Kod misollari kiritish mumkin (agar kerak bo'lsa)
- O'zbek tilida yozing
- Har doim ijobiy, rag'batlantiruvchi va motivatsion bo'ling
- Agar savol aniq bo'lmasa, qo'shimcha savollar bering
- Misollar va amaliy qo'llanishlar kiritishga harakat qiling
- Emojilar va formatlashdan foydalanib, javobni qiziqarli qiling

Savol: ${prompt}

Qisqa, aniq va foydali javob bering:`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          generationConfig,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(
          `API Error (${response.status}): ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data: GeminiResponse = await response.json();

      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedText) {
        throw new Error("No response generated from the API");
      }

      return generatedText;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (timeout) or certain client errors
      if (
        error instanceof Error &&
        (error.name === "AbortError" ||
          (error.message.includes("400") && attempt === 1))
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt);
      }
    }
  }

  // All retries failed
  console.error("Gemini API error after retries:", lastError);
  return "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing.";
}

/**
 * Generates a streaming response (for future implementation)
 * @param prompt - The user's question or prompt
 * @param onChunk - Callback function for each chunk of text
 * @returns Promise<void>
 */
export async function generateStreamingResponse(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}&alt=sse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Siz ZiyoBuddy - o'zbek tilida javob beradigan akademik yordamchi botsiz. Qisqa va aniq javob bering.\n\nSavol: ${prompt}\n\nJavob:`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk(text);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Streaming error:", error);
    onChunk("Kechirasiz, hozircha javob bera olmayapman.");
  }
}

/**
 * Validates if the API key is properly configured
 * @returns Promise<boolean>
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      {
        method: "GET",
      }
    );
    return response.ok;
  } catch (error) {
    console.error("API key validation error:", error);
    return false;
  }
}
