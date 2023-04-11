import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { postToWhisper } from "@/lib/whisper";
import { Model } from "@/models";
import { voiceToStream } from "./process-voice";
import fs from "fs";
import AddNoteToNotion from "@/pages/api/notion";

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

  const convertedFilePath = await voiceToStream(voice.file_id, bot);
  try {
    console.log("trying to transcribe....");
    const transcription = await postToWhisper(model.openai, convertedFilePath);
    await ctx.sendChatAction("typing");
    fs.unlinkSync(convertedFilePath);

    const tags = await model.getTags(transcription!);
    await AddNoteToNotion(transcription!, tags);
    await ctx.reply(`added to notion with tags: ${tags.join(", ")}`);
  } catch (err) {
    console.log(err);
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

bot.launch();
export default bot;
