import { GoogleGenAI } from '@google/genai';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const url = "https://raw.githubusercontent.com/mathiasbynens/small/master/mp3.mp3";
  const response = await fetch(url);
  const writeStream = fs.createWriteStream('test.mp3');
  await pipeline(Readable.fromWeb(response.body), writeStream);

  const uploadResult = await ai.files.upload({
      file: 'test.mp3',
      config: { mimeType: 'audio/mp3' },
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
