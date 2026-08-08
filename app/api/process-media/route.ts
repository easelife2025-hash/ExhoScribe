import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export async function POST(req: NextRequest) {
  let tmpFilePath = '';
  try {
    const body = await req.json();
    const { fileUrl, fileName, mimeType, model } = body;
    
    if (!fileUrl) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    // 1. Download file from Firebase Storage URL to a temporary file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
        const errText = await fileResponse.text();
        throw new Error(`Failed to download file from storage: ${fileResponse.status} ${fileResponse.statusText}. Details: ${errText}`);
    }

    const tmpDir = os.tmpdir();
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9.]/g, '') : 'upload.tmp';
    tmpFilePath = path.join(tmpDir, `${Date.now()}-${safeName}`);
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    fs.writeFileSync(tmpFilePath, Buffer.from(arrayBuffer));

    // 2. Upload the file to Gemini using ai.files.upload
    const uploadResult = await ai.files.upload({
      file: tmpFilePath,
      config: { mimeType: mimeType },
    });
    
    // 3. Poll until file is ACTIVE
    let fileState = await ai.files.get({ name: uploadResult.name });
    let attempts = 0;
    while (fileState.state === 'PROCESSING' && attempts < 30) {
       await new Promise(resolve => setTimeout(resolve, 3000));
       fileState = await ai.files.get({ name: uploadResult.name });
       attempts++;
    }
    if (fileState.state === 'FAILED' || fileState.state === 'PROCESSING') {
       throw new Error(`File processing failed on Gemini. State: ${fileState.state}`);
    }

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

    // 4. Generate content using the uploaded file URI
    let response;
    let generateAttempts = 0;
    while (generateAttempts < 3) {
      try {
        response = await ai.models.generateContent({
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
        break; // If successful, break out of loop
      } catch (genError: any) {
        generateAttempts++;
        console.warn(`Attempt ${generateAttempts} failed for generateContent:`, genError.message);
        if (generateAttempts >= 3) {
          throw new Error(`Failed to generate content after 3 attempts: ${genError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const parsedResult = JSON.parse(resultText);
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Error processing media:', error);
    return NextResponse.json({ error: error.message || 'Error processing media', stack: error.stack }, { status: 500 });
  } finally {
    // 5. Clean up the temporary file
    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      try {
        fs.unlinkSync(tmpFilePath);
      } catch (err) {
        console.error('Failed to delete temporary file:', err);
      }
    }
  }
}
