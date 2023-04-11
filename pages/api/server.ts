import { NextApiRequest, NextApiResponse } from "next";
import "@/lib/telegram-bot";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ response: "server started" });
}
