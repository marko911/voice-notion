import bot from "@/lib/telegram-bot";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  bot.handleUpdate(req.body); 
  console.log("req bodyt from bot", req.body);
  res.status(200).json({ response: "done" });
}
