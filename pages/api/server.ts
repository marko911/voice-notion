import { NextApiRequest, NextApiResponse } from "next";
import bot from "@/lib/telegram-bot";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("bot boy started", bot);
  res.status(200).json({ response: "server started" });
}
