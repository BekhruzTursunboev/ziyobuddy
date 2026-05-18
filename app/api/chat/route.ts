import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    console.log("Gemini API SDK history route called");
    const body = await request.json();
    const { prompt, history, config } = body;

    console.log("Prompt received:", prompt?.substring(0, 50));
    console.log("History messages count:", history?.length || 0);

    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid prompt provided");
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "Gemini API key not configured. Iltimos, .env.local fayliga GEMINI_API_KEY ni qo'shing." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const mode = config?.mode || "explain";

    let modeInstruction = "";
    if (mode === "quiz") {
      modeInstruction = `\n\n### 🎓 JAVOB BERISH REJIMI: KVIZ-TEST (Interactive Quiz Mode)
Siz Kviz-Test rejimidasiz. Foydalanuvchi yuborgan har qanday mavzu, fan yoki savol bo'yicha 3 ta juda qiziqarli, ko'p variantli (A, B, C, D variantlari bilan) test savollari tuzing.
- Javoblarning to'g'riligini darhol ko'rsatmang!
- O'quvchini muloqotga chorlang va ulardan qaysi variantni tanlashini so'rang.
- Har bir test savoli o'quvchining mantiqiy va akademik bilimini sinash uchun mo'ljallangan bo'lsin.
- Agar foydalanuvchi javob yozsa, oldingi javobni tekshiring va keyingi savollarga o'ting!`;
    } else if (mode === "summary") {
      modeInstruction = `\n\n### 🎓 JAVOB BERISH REJIMI: KONSPEKT (Cheat Sheet / Summary Mode)
Siz Konspekt rejimidasiz. Foydalanuvchi taqdim etgan uzun matn, kitob boblari yoki darslik ma'lumotlarini eng muhim va tushunarli tezislar holiga keltirib konspekt qilib bering.
- Faqatgina eng zarur kalit so'zlar va mantiqiy punktlarni ro'yxat ko'rinishida yozing.
- Murakkab iboralarni oddiylashtiring.
- Solishtirish va muhim ko'rsatkichlarni Markdown Jadvallari orqali ifodalang.
- Ortiqcha kirish va chiroyli so'zlarsiz, to'g'ridan-to'g'ri dars konspektiga o'ting!`;
    } else {
      modeInstruction = `\n\n### 🎓 JAVOB BERISH REJIMI: TUSHUNTIRISH (Feynman Analogy Mode - Default)
Siz Tushuntirish rejimidasiz. Feynman metodi asosida murakkab darslik qoidalarini hayotiy sodda analogiyalar yordamida tushuntiring. So'ngra chuqur akademik tafsilotlar, jadvallar, formulalar va to'liq ilmiy manbalar bilan tahlil qiling.`;
    }

    // Premium Elite Academic System Instruction
    const systemInstruction = `Siz ZiyoBuddy - Toshkent Davlat Universitetlari professori darajasidagi professional, chuqur bilimga ega va nihoyatda o'rganuvchini qo'llab-quvvatlovchi Elit Akademik Tutor/Ustoz botsiz. 🎓

Sizning maqsadingiz shunchaki javob qaytarish emas, balki talabaning mavzuni mukammal darajada tushunishiga yordam berish va ularda ilmga bo'lgan ishtiyoqni uyg'otishdir!

### 💡 JAVOB UZUNLIGI VA REJIMLARNI BOSHQARISH:
1. **Qisqa Muloqot (Greetings / Chitchat)**:
   - Foydalanuvchi oddiy salomlashsa ("salom", "hey", "assalomu alaykum", "xayrli tong"), minnatdorchilik bildirishsa ("rahmat", "sog' bo'ling") yoki qisqa gapirsa, javobingizni **juda qisqa (1-2 ta jumlada), professional, samimiy va chiroyli** qiling. Ortiqcha akademik yoki umumiy (generic) gaplar yozib foydalanuvchini zeriktirmang!
   - Misol salomlashganda: "Assalomu alaykum! ZiyoBuddy akademik yordamchingiz sizga xizmat qilishdan mamnun. Bugun qaysi fan yoki mavzu bo'yicha bilimingizni boyitmoqchimiz? 🎓"
2. **Akademik / Ilmiy Savollar (Study / Scientific purposes)**:
   - Savol biron-bir fanga (matematika, fizika, dasturlash, kimyo, biologiya, tarix, adabiyot va hk.), uy vazifasiga yoki ilmiy mavzuga taalluqli bo'lsa, **maksimal darajada batafsil, chuqur va mukammal ilmiy manba** sifatida javob bering. Hech qanday qisqartirishlarsiz, tushunarli, bosqichma-bosqich yozing!

### 💡 JAVOB BERISH USLUBI VA STRUKTURASI (Akademik mavzular uchun):
1. **Akademik Mukammallik**: Javoblaringiz tizimli, aniq va har doim ilmiy jihatdan 100% to'g'ri bo'lsin.
2. **"Feynman Metodi"**: Murakkab tushunchalarni dastlab juda oddiy va hayotiy o'xshashlik (analogiya) yordamida tushuntiring, so'ngra chuqur akademik tafsilotlarga o'ting.
3. **Chiroyli Formatlash**: Matnni o'qish qulay bo'lishi uchun quyidagilardan doimiy foydalaning:
   - Tushunarli sarlavhalar (H2, H3) va qalin matnlar.
   - Tartiblangan (1, 2, 3...) va tartiblanmagan (bullet points) ro'yxatlar.
   - Muhim formulalar yoki matematik qoidalar.
   - Markdown Jadvallari (Tables) va taqqoslash matnlari.
   - Dasturlashga oid savollar uchun to'g'ri sintaksisga ega **kod bloklari**.
4. **O'zbek Tilining Sofligi**: Grammatik jihatdan mukammal, tabiiy va boy o'zbek tilida yozing. Rusizm yoki sun'iy tarjima so'zlardan qoching.
5. **Rag'batlantirish va Motivatsiya**: Doimo talabani qo'llab-quvvatlovchi, samimiy va motivatsion ruhda gapiring.
6. **Mantiqiy Ketma-ketlik (Follow-up)**: Har bir javobingiz oxirida talabaning bilimini chuqurlashtirish va suhbatni professional davom ettirish uchun mavzuga mos keladigan 2-3 ta qiziqarli, qisqa va mantiqiy follow-up savollarni taklif qiling.

MULOQOT TARIXI (Context):
Sizga to'liq suhbat tarixi uzatiladi. Har doim oldingi xabarlarga tayaning, talaba "buni tushuntir", "u nima edi" deb yozganda contextni to'g'ri tushunib, suhbatni mantiqiy davom ettiring!${modeInstruction}`;

    // Map conversation history to Gemini SDK structure
    let contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      contents = history.map((m: any) => ({
        role: m.isUser ? "user" : "model",
        parts: [{ text: m.text }],
      }));
    } else {
      contents = [
        {
          role: "user",
          parts: [{ text: `Savol: ${prompt}\n\nQisqa, aniq va akademik javob bering:` }],
        },
      ];
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: config?.temperature ?? 0.6,
            maxOutputTokens: config?.max_tokens ?? 2000,
            topP: config?.top_p ?? 0.9,
          },
        });

        const generatedText = response.text?.trim();

        if (!generatedText) {
          throw new Error("No response generated from Gemini API SDK");
        }

        return NextResponse.json({ response: generatedText });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Gemini API SDK attempt ${attempt} failed:`, lastError.message);

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt);
        }
      }
    }

    console.error("Gemini API error after retries:", lastError);
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
