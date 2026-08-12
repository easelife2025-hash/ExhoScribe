import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemInstruction = `You are a helpful AI assistant for analyzing meeting recordings. 
Use the provided recording context (transcript, summary, action items, chapters, etc.) to answer the user's questions. 
You can help draft emails, summarize points, or answer specific questions based on the context.
IMPORTANT: If the user asks something completely unrelated to the recording's content or general assistance derived from it, you must reply exactly with: "I can only help with questions related to this recording's content."

=== RECORDING CONTEXT ===
${context || 'No context provided.'}
=========================`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [...(history || []), { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
