import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, studentProfile, targetProgram, taskType } = body;

    let systemInstruction = `Ты — профессиональный, объективный AI-консультант платформы UniFlow по поступлению в университеты Казахстана (ЕНТ, IELTS, GPA, госгранты, военная кафедра, общежития).
Твоя задача — давать честный, структурированный, практический анализ без ложных обещаний. 
Отвечай структурированно, кратко и дружелюбно на русском языке, используя маркированные списки и четкие выводы.`;

    let userPrompt = prompt;

    if (taskType === "why_fits") {
      userPrompt = `Проанализируй, почему программа "${targetProgram?.name}" (${targetProgram?.university}) подходит абитуриенту:
Имя: ${studentProfile?.name || "Абитуриент"}
ЕНТ: ${studentProfile?.unt ?? "еще не сдавал"}
IELTS: ${studentProfile?.ielts ?? "нет"}
GPA: ${studentProfile?.gpa ?? "не указан"}
Бюджет: ${studentProfile?.budget ? studentProfile.budget.toLocaleString() + " KZT/год" : "не указан"}
Интересы: ${Array.isArray(studentProfile?.interests) ? studentProfile.interests.join(", ") : studentProfile?.interest}
Нужно общежитие: ${studentProfile?.dormitoryNeeded ? "Да" : "Нет"}
Военная кафедра: ${studentProfile?.militaryDepartment ? "Важна" : "Не обязательна"}

Дай 3 ключевых фактора соответствия и 1 объективный риск/предостережение.`;
    } else if (taskType === "essay_review") {
      userPrompt = `Оцени мотивационное эссе / профиль абитуриента для поступления на программу "${targetProgram?.name}" в "${targetProgram?.university}":
Текст / заметки: "${prompt}"
Дай конструктивную критику, 3 сильные стороны и 2 конкретных совета по усилению шансов на грант/стипендию.`;
    }

    const aiResponse = await askGemini(userPrompt, systemInstruction);

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error: any) {
    console.error("AI Advisor API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate AI response",
      },
      { status: 500 }
    );
  }
}
