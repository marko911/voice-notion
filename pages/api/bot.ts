
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  
  console.log('req bodyt from bot', req.body)
  res.status(200).json({ response: "done" });
  }
