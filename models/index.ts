import { AgentExecutor, Tool, initializeAgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";
import { Configuration } from "openai";
import { OpenAIApi } from "openai";

const openAIApiKey = process.env.OPENAI_API_KEY!;

const params = {
  verbose: true,
  temperature: 1,
  openAIApiKey,
  modelName: "gpt-4o-mini",
  maxConcurrency: 1,
  maxTokens: 4000,
  maxRetries: 5,
};

export class Model {
  // public tools: Tool[];
  public executor?: AgentExecutor;
  public openai: OpenAIApi;
  public model: ChatOpenAI;

  constructor() {
    const configuration = new Configuration({
      apiKey: openAIApiKey,
    });

    // this.tools = [tagsTool];
    this.openai = new OpenAIApi(configuration);
    this.model = new ChatOpenAI(params, configuration);
  }

  public async getTags(input: string): Promise<string[]> {
    const res = await this.model.call([
      new HumanChatMessage(
        `categorize this phrase into topics :  "${input}". Prioritize categories like how-to's, lists, # of ways to do x, lessons learned, and include the topic category like 'ai' or 'crypto' or 'web development'.
      Example: 'how to build an nft project using Vercel in 30 minutes' should return tags such as 'ai', 'nft', 'how to', 'crypto','vercel', 'indie hacking'. If there is a specific library or technology mentioned as is the case in the example, prioritize including that specific word as a tag in the result over other tags. In the example, 'Vercel' should be part of the result.
          Return it as tags, at most 3 tags, return as a comma separated list`
      ),
    ]);

    try {
      console.log("parsing json....type:", typeof res.text);
      console.log("access item text is", res.text);
      const result = res.text.split(",");
      return result as unknown as string[];
    } catch (err) {
      return res.text as unknown as string[];
    }
  }
}
