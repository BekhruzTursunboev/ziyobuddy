export async function generateAcademicResponse(
  prompt: string
): Promise<string> {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": "AIzaSyCh4gJKCbKn-B732obXrxdYAoRvEuLphSs",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Siz ZiyoBuddy - o'zbek tilida javob beradigan professional, do'stona va interaktiv akademik yordamchi botsiz. 🎓

MUHIM QOIDALAR:
- Javobingiz QISQA va ANIQ bo'lsin
- Muhim ma'lumotlarni bering, ortiqcha tafsilotlardan saqlaning
- Ilmiy terminlardan foydalaning, lekin sodda tilda tushuntiring
- To'g'ridan-to'g'ri javob bering
- O'zbek tilida yozing
- Kod misollari kiritish mumkin
- Har doim ijobiy va rag'batlantiruvchi bo'ling
- Emojilar va formatlashdan foydalanib, javobni qiziqarli qiling

Savol: ${prompt}

Qisqa, aniq va foydali javob bering:`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Kechirasiz, javob olishda xatolik yuz berdi."
    );
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Kechirasiz, hozirda javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.";
  }
}
