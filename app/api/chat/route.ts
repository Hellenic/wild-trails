import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { wildTrailsTools } from "@/lib/ai/tools";
import { GAME_CREATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requireAuth, handleApiError } from "@/lib/api/auth";

// Configuration
export const maxDuration = 30; // Allow up to 30 seconds for streaming responses
const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    console.log("=== Chat API Request ===");
    
    // Require authentication and get user
    const user = await requireAuth();
    console.log("✓ Authentication successful", { userId: user.id });

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { messages } = body;
    console.log("Received messages count:", messages?.length);

    // Validate API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("❌ Google AI API key not configured");
      return new Response(
        JSON.stringify({ 
          error: "Google AI API key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to environment variables." 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    console.log("✓ Google AI API key configured");

    // Convert UIMessages from @ai-sdk/react to ModelMessages for streamText
    const modelMessages = convertToModelMessages(messages);
    console.log("Converted messages:", JSON.stringify(modelMessages, null, 2));

    // Stream the response using Google Gemini
    console.log(`Starting stream with model: ${GEMINI_MODEL}`);
    const result = streamText({
      model: google(GEMINI_MODEL),
      system: GAME_CREATION_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: wildTrailsTools(user), // Pass user to tool factory
      temperature: 0.7, // Balanced creativity and consistency
      onFinish: async ({ text, toolCalls, toolResults, finishReason }) => {
        // Log completion for debugging
        console.log("=== Chat completion ===");
        console.log("Text length:", text.length);
        console.log("Text preview:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
        console.log("Tool calls count:", toolCalls.length);
        console.log("Finish reason:", finishReason);
        if (toolCalls.length > 0) {
          console.log("Tool calls:", JSON.stringify(toolCalls, null, 2));
        }
      },
    });

    console.log("✓ Stream created, returning response");
    
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("=== Chat API Error ===");
    console.error("Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Use existing error handler for consistency
    return handleApiError(error);
  }
}

