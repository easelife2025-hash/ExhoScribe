import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  let tmpFilePath = '';
  try {
    const { fileUrl, fileName, mimeType, model } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Download file from Firebase Storage URL to a temporary file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
        throw new Error('Failed to download file from storage');
    }

    const tmpDir = os.tmpdir();
    tmpFilePath = path.join(tmpDir, `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.]/g, '')}`);
    
    // Stream to file to avoid memory limits
    if (fileResponse.body) {
      const fileStream = fs.createWriteStream(tmpFilePath);
      // convert web ReadableStream to Node Readable
      const readableWebStream = fileResponse.body as any;
      await pipeline(Readable.fromWeb(readableWebStream), fileStream);
    } else {
       // fallback
       const buffer = await fileResponse.arrayBuffer();
       fs.writeFileSync(tmpFilePath, Buffer.from(buffer));
    }

    // 2. Upload the file to Gemini using ai.files.upload
    const uploadResult = await ai.files.upload({
      file: tmpFilePath,
      config: { mimeType },
    });
    
    // Create prompt for AI
    const prompt = `Analyze this audio/video recording. Generate a detailed transcript with speakers and timestamps. Also generate a summary, a list of action items, decisions made, tasks identified, chapters with timestamps, keywords, and overall sentiment.
Return the result in this exact JSON structure:
{
  "duration": "string (MM:SS)",
  "summary": "string",
  "keywords": ["string"],
  "transcript": [
    { "speaker": "string", "time": "string (MM:SS)", "text": "string" }
  ],
  "chapters": [
    { "time": "string (MM:SS)", "title": "string", "summary": "string" }
  ],
  "actionItems": ["string"],
  "decisions": ["string"],
  "tasks": ["string"],
  "sentiment": "string"
}`;

    // 3. Generate content using the uploaded file URI
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.6-flash',
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const parsedResult = JSON.parse(resultText);
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Error processing media:', error);
    return NextResponse.json({ error: error.message || 'Error processing media' }, { status: 500 });
  } finally {
    // 4. Clean up the temporary file
    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      try {
        fs.unlinkSync(tmpFilePath);
      } catch (err) {
        console.error('Failed to delete temporary file:', err);
      }
    }
  }
}
