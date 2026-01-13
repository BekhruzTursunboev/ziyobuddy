const API_KEY = "1a9ace5a92fa4161800df3952e9c9ad3.N6KD9Jbwr1APZ4Ev";
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface GenerationConfig {
  max_tokens: number;
  temperature: number;
  top_p?: number;
}

interface GLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GLMResponse {
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

/**
 * Delays execution for a specified amount of time
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates an academic response using GLM API
 * @param prompt - The user's question or prompt
 * @param config - Optional generation configuration
 * @returns Promise<string> - The generated response
 */
export async function generateAcademicResponse(
  prompt: string,
  config: Partial<GenerationConfig> = {}
): Promise<string> {
  const generationConfig: GenerationConfig = {
    max_tokens: config.max_tokens || 800,
    temperature: config.temperature || 0.7,
    top_p: config.top_p || 0.9,
  };

  const systemMessage: GLMMessage = {
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

  const userMessage: GLMMessage = {
    role: "user",
    content: `Savol: ${prompt}\n\nQisqa, aniq va foydali javob bering:`,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "glm-4",
          messages: [systemMessage, userMessage],
          ...generationConfig,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: GLMResponse = await response.json();
        throw new Error(
          `API Error (${response.status}): ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data: GLMResponse = await response.json();

      const generatedText = data.choices?.[0]?.message?.content?.trim();

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
  console.error("GLM API error after retries:", lastError);
  return "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing. 🤔";
}

/**
 * Validates if the API key is properly configured
 * @returns Promise<boolean>
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/models",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    return response.ok;
  } catch (error) {
    console.error("API key validation error:", error);
    return false;
  }
}
