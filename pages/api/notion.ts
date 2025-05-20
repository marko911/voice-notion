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

// Use environment variable for the target database ID, with a fallback to the hardcoded one.
const configuredDatabaseId =
  process.env.NOTION_DATABASE_ID || "a1d0e89af7f24e63955034a70952efe0";
// Environment variable for the parent page ID, under which a new database will be created if the target one isn't found.
const parentPageIdForNewDbCreation =
  process.env.NOTION_PARENT_PAGE_ID_FOR_NEW_DATABASE;

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
  console.log("tags to add...", tags);
  // 1. Handle "Tweet ideas" database for tag colors (existing logic)
  const pageForTagColors = await notion.search({
    query: "Tweet ideas", // This database is used to source existing tag colors
    filter: {
      value: "database",
      property: "object",
    },
  });

  if (!pageForTagColors.results || pageForTagColors.results.length === 0) {
    console.warn(
      "Warning: Notion database 'Tweet ideas' (for tag colors) not found or is empty. Using random colors for tags. Please ensure it exists and the integration has access."
    );
  }

  const toTag = (tag: string): { name: string; color: string } => {
    let color = randColor(); // Default to random color
    if (
      pageForTagColors.results &&
      pageForTagColors.results.length > 0 &&
      pageForTagColors.results[0].properties
    ) {
      // Attempt to find existing tag color only if the database and properties exist
      const tagDatabase = pageForTagColors.results[0] as any;
      const existingOption =
        tagDatabase.properties.Tags?.multi_select?.options?.find(
          (op: any) => op.name === tag
        );
      if (existingOption) {
        color = existingOption.color;
      }
    }
    return { name: tag, color };
  };

  const notionPageProperties = {
    // Structure of the page to be created
    Tags: {
      multi_select: tags.map(toTag),
    },
    Idea: {
      title: [
        {
          text: {
            content: text,
          },
        },
      ],
    },
  };

  let currentTargetDbId = configuredDatabaseId;

  try {
    // 2. Attempt to create page in the configured/existing database
    const response = await notion.pages.create({
      parent: { database_id: currentTargetDbId },
      properties: notionPageProperties as any, // Cast to any for simplicity with Notion's flexible schema
    });
    console.log("Note added to Notion database:", currentTargetDbId);
    return response;
  } catch (error: any) {
    console.error(
      `Error adding page to database ${currentTargetDbId}: ${error.message}`
    );

    // 3. If page creation failed, check if it's a "database not found" type error
    //    and if a parent page ID is configured for creating a new database.
    const isNotFoundError =
      error.code === "object_not_found" || // Common Notion API error code for not found
      (error.message &&
        (error.message.includes("Could not find database") ||
          error.message.includes("should be a valid UUID") || // Often indicates the DB ID was wrong
          error.message.toLowerCase().includes("not found"))) ||
      error.status === 404;

    if (isNotFoundError && parentPageIdForNewDbCreation) {
      console.log(
        `Target database ${currentTargetDbId} not found or inaccessible. Attempting to create a new one under page ID ${parentPageIdForNewDbCreation}.`
      );
      try {
        const newDb = await notion.databases.create({
          parent: { page_id: parentPageIdForNewDbCreation },
          title: [
            { type: "text", text: { content: "Voice Notes (auto-created)" } },
          ],
          // Define properties for the new database that match what notionPageProperties expects
          properties: {
            Idea: { title: {} }, // This will be the main "Name" or "Title" column
            Tags: { multi_select: {} }, // For the tags
          },
        });
        console.log("New database created with ID:", newDb.id);
        currentTargetDbId = newDb.id; // Update targetDbId to the new one

        // Retry creating the page in the newly created database
        const retryResponse = await notion.pages.create({
          parent: { database_id: currentTargetDbId },
          properties: notionPageProperties as any,
        });
        console.log(
          "Note added to newly created Notion database:",
          currentTargetDbId
        );
        return retryResponse;
      } catch (createDbError: any) {
        console.error(
          `Failed to create or add page to new database: ${createDbError.message}`
        );
        // If creating the DB or adding page to new DB fails, throw this more specific error
        throw createDbError;
      }
    } else {
      // If it wasn't a "not found" error, or no parent page ID was configured,
      // re-throw the original error from the first attempt to create the page.
      console.log(
        "Not a database not_found error or no parentPageIdForNewDbCreation is set. Rethrowing original error."
      );
      throw error;
    }
  }
}
