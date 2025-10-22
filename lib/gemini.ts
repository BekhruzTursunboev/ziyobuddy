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
          "X-goog-api-key": "AIzaSyDp5Nl-9hQJhQKhsqmG3tgGtrWvndiuk5I",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Siz ZiyoBuddy - o'zbek tilida javob beradigan akademik yordamchi botsiz. 

MUHIM QOIDALAR:
- Javobingiz QISQA va ANIQ bo'lsin
- Faqat  muhim ma'lumotlarni bering
- Ilmiy terminlardan foydalaning, lekin sodda tilda tushuntiring
- Ortiqcha tafsilotlarsiz, to'g'ridan-to'g'ri javob bering
- O'zbek tilida yozing
-kodham yoza olasan

Savol: ${prompt}

Qisqa va aniq javob:`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
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
    return "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.";
  }
}
