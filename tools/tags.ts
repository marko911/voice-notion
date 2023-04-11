import { DynamicTool } from "langchain/tools";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const pageId= 'f1f0608297fd4990baecc5d57e9f2cc7'

export const tagsTool = new DynamicTool({
  name: "categorizing tags",
  description:
    "Use this tool to categorize a description into a tag or several tags",
  func: async (note: string) => {
    // const response = await google.search(searchPhrase, {
    //   page: 0,
    //   safe: false, // Safe Search
    //   parse_ads: false, // If set to true sponsored results will be parsed
    //   additional_params: {
    //     // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
    //   },
    // });
    //
    // console.log({ googleResponse: response });
    //
    return JSON.stringify({
      results: 'resulll',
    });
  },
});
