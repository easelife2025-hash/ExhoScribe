import { GoogleGenAI } from '@google/genai';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const url = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
  const response = await fetch(url);
  const writeStream = fs.createWriteStream('test.ogg');
  await pipeline(Readable.fromWeb(response.body), writeStream);

  const uploadResult = await ai.files.upload({
      file: 'test.ogg',
      config: { mimeType: 'audio/ogg' },
  });
  console.log("Uploaded: ", uploadResult.name);

  let fileState = await ai.files.get({ name: uploadResult.name });
  while (fileState.state === 'PROCESSING') {
     await new Promise(resolve => setTimeout(resolve, 3000));
     fileState = await ai.files.get({ name: uploadResult.name });
  }
  console.log("State:", fileState.state);
  
  try {
      const res = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  fileData: {
                    fileUri: uploadResult.uri,
                    mimeType: uploadResult.mimeType
                  }
                },
                { text: "describe this audio" }
              ]
            }
          ]
        });
      console.log(res.text);
  } catch(e) {
      console.error(e.message);
  }
}
run();
