import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { WS_URL } from "@lib/config";

export function useWebSocket() {
  const [responseTime, setResponseTime] = useState(0);

  useEffect(() => {
    const socket = io(WS_URL);

    socket.on("responseTime", (data) => {
      setResponseTime(data.responseTime);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return responseTime;
}
