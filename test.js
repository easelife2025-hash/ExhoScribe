import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const models = ['gemini-3.1-flash', 'gemini-3.0-flash', 'gemini-3.1-pro', 'gemini-3.5-flash'];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({ model: m, contents: 'hi' });
      console.log(`Model ${m} SUCCESS`);
    } catch(e) {
      console.error(`Model ${m} FAILED: ` + e.message);
    }
  }
}
run();
