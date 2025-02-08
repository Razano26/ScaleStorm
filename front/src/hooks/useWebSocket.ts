import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { WS_URL } from "@lib/config";

export function useWebSocket() {
  const [responseTime, setResponseTime] = useState(0);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket"] }); // ✅ Utiliser websocket direct

    socket.on("connect", () => {
      console.log("✅ Connecté au WebSocket !"); // ✅ DEBUG
    });

    socket.on("responseTime", (data) => {
      console.log("📡 Temps de réponse reçu :", data.responseTime); // ✅ DEBUG
      setResponseTime(data.responseTime);
    });

    socket.on("disconnect", () => {
      console.log("❌ WebSocket déconnecté");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return responseTime;
}
