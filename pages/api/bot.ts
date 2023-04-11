import { voiceToStream } from "@/lib/process-voice";
import fs from "fs";
import { postToWhisper } from "@/lib/whisper";
import { Model } from "@/models";
import { NextApiRequest, NextApiResponse } from "next";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import AddNoteToNotion from "./notion";

const telegramToken = process.env.TELEGRAM_TOKEN!;
const bot = new Telegraf(telegramToken);

let model = new Model();
console.log("starting bot....");
bot.start((ctx) => {
  ctx.reply("Welcome to my Telegram bot!");
});
//
bot.help((ctx) => {
  ctx.reply("Send me a message and I will echo it back to you.");
});

bot.on(message("voice"), async (ctx) => {
  console.log("voice");
  const voice = ctx.message.voice;
  await ctx.sendChatAction("typing");
  await ctx.reply("transcribing...");

  const convertedFilePath = await voiceToStream(voice.file_id, bot);
  try {
    console.log("trying to transcribe....");
    const transcription = await postToWhisper(model.openai, convertedFilePath);
    await ctx.sendChatAction("typing");
    await ctx.reply("transcribed: " + transcription!);
    await ctx.reply("adding to notion...");

    fs.unlinkSync(convertedFilePath);

    const tags = await model.getTags(transcription!);
    await AddNoteToNotion(transcription!, tags);
    await ctx.reply(`added to notion with tags: ${tags.join(", ")}`);
  } catch (err) {
    console.log(err);
    ctx.reply("error occured: " + err);
  }
  console.log("done transcribing, sent response");
});

bot.on(message("text"), async (ctx) => {
  const text = (ctx.message as any).text;

  if (text) {
    await ctx.sendChatAction("typing");
    ctx.reply("Thanks for reaching out pal");
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('bot request', req.body)
  await bot.handleUpdate(req.body);
  res.status(200).json({ response: "done" });
}
