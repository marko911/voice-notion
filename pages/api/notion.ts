import { Client } from "@notionhq/client";
import { NOTION_COLORS } from "@/lib/constants";
//
console.log("Bot started");
type Data = {
  response: any;
};
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});
const pageId = "5e0a3ea8211246b6832fddd2686449b6";
const databaseId = "a1d0e89af7f24e63955034a70952efe0";

interface RowSchema {
  Tags: {
    multi_select: {
      name: string;
      color: string;
    }[];
  };
  Idea: {
    title: {
      text: {
        content: string;
      }[];
    };
  };
}
const randColor = (): string =>
  NOTION_COLORS[Math.floor(Math.random() * NOTION_COLORS.length)];

export default async function AddNoteToNotion(text: string, tags: string[]) {
  const page = await notion.search({
    query: "Tweet ideas",
    filter: {
      value: "database",
      property: "object",
    },
  });

  const toTag = (tag: string): { name: string; color: string } => {
    const color =//@ts-ignore
      page.results[0].properties.Tags.multi_select.options.find(
        (op: any) => op.name === tag
      )?.color || randColor();

    return { name: tag, color };
  };
  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      Tags: {
        // @ts-ignore
        multi_select: tags.map(toTag),
      },
      Idea: {
        //@ts-ignore
        title: [
          {
            text: {
              content: text,
            },
          },
        ],
      },
    },
  });
  return response;
}
