"use client";

import React, { useEffect, useRef, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { GAME_CREATION_WELCOME_MESSAGE } from "@/lib/ai/prompts";

// Type for the create_game tool output
interface CreateGameOutput {
  success: boolean;
  game_id?: string;
  selected_role?: string;
  message?: string;
  error?: string;
}

// Type guard for create_game tool result parts
function isCreateGameToolResult(
  part: unknown
): part is {
  type: "tool-create_game";
  state: "output-available";
  output: CreateGameOutput;
} {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    part.type === "tool-create_game" &&
    "state" in part &&
    part.state === "output-available" &&
    "output" in part
  );
}

export function ChatGameCreation() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // Debug: log messages when they change
  useEffect(() => {
    console.log("Messages updated:", messages);
    console.log("Message count:", messages.length);
    if (messages.length > 0) {
      console.log("Last message:", messages[messages.length - 1]);
    }
  }, [messages]);

  // Add welcome message on mount
  const [hasWelcome, setHasWelcome] = useState(false);
  useEffect(() => {
    if (!hasWelcome && messages.length === 0) {
      // Simulate welcome message by adding it to the UI
      // eslint-disable-next-line
      setHasWelcome(true);
    }
  }, [hasWelcome, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  // Check for successful game creation in tool results and redirect
  useEffect(() => {
    for (const message of messages) {
      if (message.role === "assistant") {
        // Look for tool result parts
        for (const part of message.parts) {
          if (isCreateGameToolResult(part)) {
            const { output } = part;
            
            if (output.success && output.game_id) {
              const gameId = output.game_id;
              
              // Always navigate to setup page first
              // User can start the game from there once waypoints are generated
              const timer = setTimeout(() => {
                router.push(`/game/${gameId}/setup`);
              }, 2000);
              return () => clearTimeout(timer);
            }
          }
        }
      }
    }
  }, [messages, router]);

  const isLoading = status !== "ready";

  // Combine welcome message with actual messages
  const allMessages = hasWelcome && messages.length === 0
    ? [{
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: GAME_CREATION_WELCOME_MESSAGE }],
      }]
    : messages;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-forest-pine text-forest-mist px-6 py-4 border-b border-forest-deep/10">
        <h2 className="text-xl font-serif font-bold">Create Your Adventure</h2>
        <p className="text-sm text-forest-mist/80 mt-1">
          Chat with AI to set up your game
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {allMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-forest-pine text-forest-mist ml-4"
                  : "bg-forest-moss/20 text-forest-deep mr-4"
              }`}
            >
              {/* Display role indicator for assistant */}
              {message.role === "assistant" && (
                <div className="text-xs font-semibold text-forest-pine mb-1">
                  Wild Trails Assistant
                </div>
              )}
              
              {/* Message content - handle parts array */}
              <div className="whitespace-pre-wrap break-words">
                {message.parts.map((part, partIndex) => {
                  if (part.type === "text" && "text" in part) {
                    return (
                      <React.Fragment key={partIndex}>
                        {part.text.split("\n").map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < part.text.split("\n").length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  }
                  
                  // Handle tool invocations
                  if (part.type.startsWith("tool-") && "state" in part) {
                    const state = (part as { state?: string }).state;
                    return (
                      <div key={partIndex} className="mt-2 text-xs italic text-forest-deep/60">
                        {state === "input-available" && `🔧 Calling: ${part.type.replace("tool-", "")}...`}
                        {state === "output-available" && `✓ ${part.type.replace("tool-", "")} complete`}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-forest-moss/20 text-forest-deep rounded-lg px-4 py-3 mr-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-forest-pine rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-forest-pine rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-forest-pine rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-forest-moss/30 px-6 py-4 bg-forest-moss/5"
      >
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-forest-moss/30 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-forest-pine 
                     focus:border-transparent text-forest-deep"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-2 bg-forest-pine text-forest-mist rounded-lg 
                     hover:bg-forest-deep transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-forest-deep/80 mt-2 font-medium">
          💡 Tip: Describe your ideal adventure, and I&apos;ll help you set it up!
        </p>
      </form>
    </div>
  );
}
