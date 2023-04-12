import ffmpeg from "fluent-ffmpeg";
import { Telegraf } from "telegraf";
import axios from "axios";
import stream, { Readable, Stream } from "stream";
import { existsSync, mkdirSync } from "fs";
import fs from 'fs'

const workDir = "/tmp";

export async function voiceToStream(
  fileId: string,
  bot: Telegraf
): Promise<string> {
  if (!existsSync(workDir)) {
    mkdirSync(workDir);
  }
  const fileLink = await bot.telegram.getFileLink(fileId);
  const response = await axios({
    method: "GET",
    url: fileLink.toString(),
    responseType: "stream",
  });

  const buff = await stream2buffer(response.data);
  console.log("fast console buff  check env", process.env.FFMPEG_PATH);

  fs.readdir("/", (err, files) => {
    
    console.log("fast console files", { files,err });
    files?.forEach((file) => {
      console.log("ffffffffffffffffffffffffffffff", file);
    });
  });
  const readstream = Readable.from(buff);
  const outPath = `${workDir}/${fileId}-output.mp3`;
  return await new Promise((resolve, reject) => {
    ffmpeg(readstream)
      .format("mp3")
      .on("progress", (progress) => {
        console.log(`Processing: some ${progress} done`);
      })
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve(outPath);
      })
      .on("error", (err) => {
        console.error("Error while processing the video:", err);
        reject(err);
      })
      .save(outPath);
  });
}

async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}
