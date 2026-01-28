
import { GoogleGenAI, Type } from "@google/genai";
import { Project } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getProjectInsights(project: Project) {
  const currentStep = project.steps.find(s => s.id === project.currentStepId);
  const tasksList = currentStep?.tasks.map(t => `- ${t.title} (担当: ${t.assignee}, 完了: ${t.isCompleted ? '○' : '×'})`).join('\n') || 'なし';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        以下のプロジェクトの状況を分析し、学生団体に向けたアドバイスと、現在のタスクリストから次に優先すべきアクションを選定してください。
        
        プロジェクト名: ${project.name}
        ゴール: ${project.goal}
        現状のステップ: ${currentStep?.name || '不明'}
        現在のタスクリスト:
        ${tasksList}
        
        困っていること: ${project.issues}
      `,
      config: {
        systemInstruction: "あなたは学生団体のメンターです。現在のタスクリストの中から最も優先度が高いものを1つ選び、具体的な『次の一手』として提案してください。また、全体への短いアドバイスも添えてください。レスポンスは必ずJSON形式で、advice（100文字程度のアドバイス）とsuggestedNextAction（選定した具体的なアクション、30文字以内）の2つのフィールドを含めてください。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            suggestedNextAction: { type: Type.STRING }
          },
          required: ["advice", "suggestedNextAction"]
        }
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      advice: "プロジェクトを応援しています！一歩ずつ進んでいきましょう。",
      suggestedNextAction: project.nextAction || "未完了のタスクを確認する"
    };
  }
}
