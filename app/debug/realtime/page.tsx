"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type LogEntry = {
  time: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
};

export default function RealtimeDebugPage() {
  const [gameId, setGameId] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("Not subscribed");
  const [events, setEvents] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [showConsole, setShowConsole] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Intercept console methods to capture logs on screen
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const addLog = (type: LogEntry["type"], args: unknown[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      
      setConsoleLogs((prev) => [
        ...prev.slice(-99), // Keep last 100 logs
        {
          time: new Date().toLocaleTimeString(),
          type,
          message,
        },
      ]);
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog("log", args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog("warn", args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog("error", args);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog("info", args);
    };

    // Log that we're capturing
    console.log("🔧 Console capture enabled - logs will appear on screen");

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  // Auto-scroll console to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  const addEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  const subscribe = useCallback(() => {
    if (!gameId) {
      addEvent("❌ Please enter a game ID");
      return;
    }

    if (channel) {
      supabase.removeChannel(channel);
    }

    addEvent(`🔄 Subscribing to game: ${gameId}`);

    const newChannel = supabase
      .channel(`debug_game_points_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to ALL events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "game_points",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          addEvent(`📥 Event received: ${payload.eventType}`);
          addEvent(`   Table: ${payload.table}`);
          addEvent(`   New: ${JSON.stringify(payload.new, null, 2)}`);
          addEvent(`   Old: ${JSON.stringify(payload.old, null, 2)}`);
        }
      )
      .subscribe((status, err) => {
        setSubscriptionStatus(status);
        addEvent(`📡 Status: ${status}`);
        if (err) {
          addEvent(`❌ Error: ${JSON.stringify(err)}`);
        }
        if (status === 'SUBSCRIBED') {
          addEvent(`✅ Successfully subscribed! Listening for changes...`);
        }
        if (status === 'CHANNEL_ERROR') {
          addEvent(`❌ Channel error - Is Realtime enabled on game_points table?`);
        }
      });

    setChannel(newChannel);
  }, [gameId, channel, supabase, addEvent]);

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setSubscriptionStatus("Not subscribed");
      addEvent("🔌 Unsubscribed");
    }
  }, [channel, supabase, addEvent]);

  const testManualUpdate = async () => {
    if (!gameId) {
      addEvent("❌ Please enter a game ID first");
      return;
    }

    addEvent(`🔧 Fetching points for game ${gameId}...`);

    // Get first unvisited point
    const { data: points, error } = await supabase
      .from("game_points")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "unvisited")
      .limit(1);

    if (error) {
      addEvent(`❌ Error fetching points: ${error.message}`);
      return;
    }

    if (!points || points.length === 0) {
      addEvent("⚠️ No unvisited points found. Try resetting points first.");
      return;
    }

    const point = points[0];
    addEvent(`📍 Found point: ${point.id} (${point.type})`);
    addEvent(`🔄 Updating status to 'visited'...`);

    // Use .select() to get the updated row back - this tells us if it actually updated
    const { data: updatedData, error: updateError } = await supabase
      .from("game_points")
      .update({ status: "visited" })
      .eq("id", point.id)
      .select();

    if (updateError) {
      addEvent(`❌ Update error: ${updateError.message}`);
    } else if (!updatedData || updatedData.length === 0) {
      addEvent(`❌ UPDATE BLOCKED! No rows were updated.`);
      addEvent(`⚠️ This is likely a Row Level Security (RLS) issue.`);
      addEvent(`📋 Check: Supabase Dashboard → Authentication → Policies → game_points`);
    } else {
      addEvent(`✅ Update SUCCESS! Row updated: ${JSON.stringify(updatedData[0].status)}`);
      addEvent(`🔔 Watch for Realtime event above...`);
    }

    // Verify by re-reading the point
    addEvent(`🔍 Verifying update...`);
    const { data: verifyData } = await supabase
      .from("game_points")
      .select("status")
      .eq("id", point.id)
      .single();
    
    if (verifyData) {
      addEvent(`📊 Current status in DB: "${verifyData.status}"`);
      if (verifyData.status === "visited") {
        addEvent(`✅ CONFIRMED: Point is now visited in database`);
      } else {
        addEvent(`❌ PROBLEM: Point is still "${verifyData.status}" - update did NOT persist`);
      }
    }
  };

  const resetPoints = async () => {
    if (!gameId) {
      addEvent("❌ Please enter a game ID first");
      return;
    }

    addEvent(`🔄 Resetting all points to 'unvisited'...`);

    const { error } = await supabase
      .from("game_points")
      .update({ status: "unvisited" })
      .eq("game_id", gameId);

    if (error) {
      addEvent(`❌ Reset error: ${error.message}`);
    } else {
      addEvent(`✅ All points reset to 'unvisited'`);
    }
  };

  const checkRealtimePublication = async () => {
    addEvent("🔍 Checking database connectivity...");
    
    // Simple check: can we query the game_points table?
    const { data: points, error: pointsError } = await supabase
      .from('game_points')
      .select('id, status')
      .limit(1);
    
    if (pointsError) {
      addEvent(`❌ Cannot query game_points: ${pointsError.message}`);
    } else {
      addEvent(`✅ Database connected - found ${points?.length || 0} points`);
    }

    // Check games table too
    const { error: gamesError } = await supabase
      .from('games')
      .select('id')
      .limit(1);
    
    if (gamesError) {
      addEvent(`❌ Cannot query games: ${gamesError.message}`);
    } else {
      addEvent(`✅ Can query games table`);
    }
    
    addEvent("📋 To verify Realtime: Supabase Dashboard → Database → Replication");
    addEvent("🔗 Make sure game_points, games, players are listed there");
  };

  // Test the actual server-side API that bypasses RLS
  const testServerUpdate = async () => {
    if (!gameId) {
      addEvent("❌ Please enter a game ID first");
      return;
    }

    addEvent(`🔧 Testing server-side API update...`);

    // First get a point and player info
    const { data: points } = await supabase
      .from("game_points")
      .select("*")
      .eq("game_id", gameId)
      .limit(1);

    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .limit(1);

    if (!points?.length) {
      addEvent(`❌ No points found for game`);
      return;
    }
    if (!players?.length) {
      addEvent(`❌ No players found for game`);
      return;
    }

    const point = points[0];
    const player = players[0];

    addEvent(`📍 Testing with point at: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`);
    addEvent(`👤 Player ID: ${player.id}`);
    addEvent(`📏 Simulating location ON TOP of the point...`);

    // Call the actual location-update API with position ON the point
    try {
      const response = await fetch('/api/game/location-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          player_id: player.id,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: 10,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        addEvent(`❌ API Error ${response.status}: ${JSON.stringify(data)}`);
      } else {
        addEvent(`✅ API Response: ${JSON.stringify(data)}`);
        if (data.proximity_events?.length > 0) {
          addEvent(`🎯 PROXIMITY TRIGGERED! Events: ${data.proximity_events.length}`);
          for (const evt of data.proximity_events) {
            addEvent(`   - Point ${evt.point_id} (${evt.point_type}): ${evt.distance}m`);
          }
          addEvent(`🔔 Now watch for Realtime event above...`);
        } else {
          addEvent(`⚠️ No proximity events returned`);
          addEvent(`   Point might already be visited, or API logic issue`);
        }
      }
    } catch (err) {
      addEvent(`❌ Fetch error: ${err}`);
    }

    // Verify point status
    const { data: verifyData } = await supabase
      .from("game_points")
      .select("status")
      .eq("id", point.id)
      .single();
    
    addEvent(`📊 Point status in DB: "${verifyData?.status}"`);
  };

  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel, supabase]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "info": return "text-blue-400";
      default: return "text-gray-300";
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">🔧 Realtime Debug</h1>
        
        {/* Connection Panel */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Connection</h2>
          
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID (UUID)"
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 mb-3 text-sm"
          />
          
          <div className="grid grid-cols-2 sm:flex gap-2 flex-wrap">
            <button
              onClick={subscribe}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm"
            >
              Subscribe
            </button>
            <button
              onClick={unsubscribe}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm"
            >
              Unsubscribe
            </button>
            <button
              onClick={testManualUpdate}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm"
            >
              Test Update
            </button>
            <button
              onClick={resetPoints}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium text-sm"
            >
              Reset Points
            </button>
            <button
              onClick={checkRealtimePublication}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-sm"
            >
              Check DB
            </button>
            <button
              onClick={testServerUpdate}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium text-sm col-span-2"
            >
              🔥 Test Server API
            </button>
          </div>
          
          <div className="mt-3 text-sm">
            <span className="text-gray-400">Status: </span>
            <span className={`font-mono ${
              subscriptionStatus === 'SUBSCRIBED' ? 'text-green-400' :
              subscriptionStatus === 'CHANNEL_ERROR' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {subscriptionStatus}
            </span>
          </div>
        </div>

        {/* Console Logs Panel */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">
              📟 Console Logs 
              <span className="text-xs text-gray-400 ml-2">({consoleLogs.length})</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                {showConsole ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => {
                  const text = consoleLogs.map(l => `[${l.time}] ${l.message}`).join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
              >
                Copy
              </button>
              <button
                onClick={() => setConsoleLogs([])}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
          
          {showConsole && (
            <div className="bg-black rounded-lg p-2 h-48 overflow-y-auto font-mono text-xs">
              {consoleLogs.length === 0 ? (
                <p className="text-gray-500">Console logs will appear here...</p>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className={`${getLogColor(log.type)} whitespace-pre-wrap mb-1`}>
                    <span className="text-gray-500">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
        
        {/* Event Log Panel */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">📡 Realtime Events</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = events.join('\n');
                  navigator.clipboard.writeText(text);
                  addEvent("📋 Copied to clipboard!");
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
              >
                Copy
              </button>
              <button
                onClick={() => setEvents([])}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-2 h-48 overflow-y-auto font-mono text-xs">
            {events.length === 0 ? (
              <p className="text-gray-500">No events yet. Subscribe to a game to start.</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="text-gray-300 whitespace-pre-wrap mb-1">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <h2 className="text-lg font-semibold mb-3">How to Use</h2>
          <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
            <li>Paste a game ID from an existing game</li>
            <li>Click <strong>Subscribe</strong> → should show &quot;SUBSCRIBED&quot;</li>
            <li>Click <strong>Test Update</strong> → updates a point in DB</li>
            <li>If working: <strong>📥 Event received</strong> appears</li>
            <li>If no event: Realtime is NOT enabled</li>
          </ol>
          
          <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg text-sm">
            <p className="text-yellow-400">
              <strong>⚠️ No events?</strong> Check Supabase Dashboard → Database → Replication
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
