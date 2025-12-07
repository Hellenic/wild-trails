# Wild Trails AI Module

This directory contains AI-powered features for Wild Trails, powered by Google Gemini and Vercel AI SDK.

## Contents

### `tools.ts`
AI tool definitions that enable the language model to interact with Wild Trails Core API.

**Available Tools**:
- `create_game` - Creates new games from conversational parameters
- `get_game_status` - Retrieves game status and details

Each tool includes:
- Type-safe Zod schema for parameters
- Execution function that calls Core API
- Rich descriptions for LLM understanding
- Error handling and user-friendly messages

### `prompts.ts`
System prompts and messages for guiding AI behavior.

**Exports**:
- `GAME_CREATION_SYSTEM_PROMPT` - Main system prompt with conversation guidelines
- `GAME_CREATION_WELCOME_MESSAGE` - Initial greeting for users

## Usage

### In API Routes

```typescript
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { wildTrailsTools } from "@/lib/ai/tools";
import { GAME_CREATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const result = streamText({
  model: google("gemini-1.5-pro-latest"),
  system: GAME_CREATION_SYSTEM_PROMPT,
  messages,
  tools: wildTrailsTools,
});
```

### Adding New Tools

1. Define tool in `tools.ts`:
```typescript
export const myNewTool = tool({
  description: "What this tool does",
  parameters: z.object({
    param1: z.string(),
  }),
  execute: async (params) => {
    // Implementation
    return { success: true };
  },
});
```

2. Add to exports:
```typescript
export const wildTrailsTools = {
  create_game: createGameTool,
  get_game_status: getGameStatusTool,
  my_new_tool: myNewTool, // Add here
};
```

3. Update system prompt to explain when to use the new tool.

## Configuration

### Required Environment Variables
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key

### Google Cloud Project
- Project ID: `wild-trails-480510`
- Project Number: `670379900010`
- Required API: Generative Language API

## Documentation

For detailed documentation, see:
- Implementation Guide: `/docs/ai-chat-implementation.md`
- Testing Guide: `/docs/ai-chat-testing-guide.md`
- Summary: `/docs/ai-chat-summary.md`

## Development

### Testing Tools Locally

```typescript
import { createGameTool } from "@/lib/ai/tools";

const result = await createGameTool.execute({
  name: "Test Game",
  password: "test123",
  // ... other params
});

console.log(result);
```

### Debugging

Enable verbose logging in tool execution:
```typescript
execute: async (params) => {
  console.log("Tool called with:", params);
  try {
    const result = await gameAPI.create(params);
    console.log("Tool result:", result);
    return { success: true, ...result };
  } catch (error) {
    console.error("Tool error:", error);
    return { success: false, error: error.message };
  }
}
```

## Best Practices

1. **Tool Descriptions**: Make them detailed and clear
2. **Parameter Schemas**: Use strict Zod validation
3. **Error Handling**: Always return user-friendly messages
4. **Logging**: Log tool execution for debugging
5. **Type Safety**: Leverage TypeScript for tool parameters and returns

## Future Extensions

Potential new tools:
- `modify_game` - Edit existing game parameters
- `suggest_location` - Recommend locations based on preferences
- `validate_points` - Check if waypoints are accessible
- `estimate_difficulty` - Analyze game parameters for difficulty

## Dependencies

- `ai` - Vercel AI SDK core
- `@ai-sdk/google` - Google Gemini provider
- `zod` - Schema validation
- Core API client (`@/lib/api/client`)

## Test Scenarios

### 1. Basic Conversation Flow

**Objective**: Verify the AI can guide a user through complete game creation.

**Steps**:
1. Navigate to `/game/create`
2. Ensure "Chat Mode" is selected
3. Read the welcome message from the AI
4. Engage in conversation following this pattern:

**Example Conversation**:
```
User: "I want to create a hiking game"
AI: Should ask about location

User: "Around Central Park in New York"
AI: Should ask about duration

User: "2 hours"
AI: Should ask about distance/radius

User: "5 kilometers"
AI: Should ask about game name

User: "Central Park Adventure"
AI: Should ask about password

User: "test123"
AI: Should create the game and provide game ID
```

**Expected Results**:
- AI asks relevant follow-up questions
- AI extracts all required parameters
- Game is created successfully
- AI provides game ID and link to setup page
- User is redirected to `/game/{game_id}/setup` after 2 seconds

### 2. Quick Creation with All Details

**Objective**: Test when user provides all information upfront.

**Input**:
```
"Create a 3-hour hiking game called 'Mountain Quest' in Yellowstone National Park, 
covering 7 kilometers, password 'adventure123', with AI-generated waypoints"
```

**Expected Results**:
- AI extracts all parameters from the single message
- AI confirms the details
- Game is created without additional questions
- Success message with game ID