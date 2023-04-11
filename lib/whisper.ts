import { createReadStream } from "fs";
import { OpenAIApi } from "openai";

export async function postToWhisper(openai: OpenAIApi, filepath: string) {
  try {
    const transcript = await openai.createTranscription(
      createReadStream(filepath) as any,
      "whisper-1"
    );
    return transcript.data.text;
  } catch (err) {
    console.log("error in transcription request: ", err);
  }
}
