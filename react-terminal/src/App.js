import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const App = () => {
  const terminalRef = useRef(null);
  const containerRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Connecting...");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Initialize the terminal
    const terminal = new Terminal({
      theme: {
        background: "#1E1E1E",
        foreground: "#D4D4D4",
        cursor: "#00FF00",
        selection: "#264F78",
      },
      cursorBlink: true,
      fontFamily: "Courier, monospace",
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    // Connect to the WebSocket server
    const websocket = new WebSocket("ws://localhost:5000");

    websocket.onopen = () => {
      terminal.writeln("\x1b[32mConnected to server\x1b[0m");
      setConnected(true);
      setConnectionMessage("Connected");
    };

    websocket.onmessage = (event) => {
      terminal.write(event.data);
    };

    websocket.onclose = () => {
      terminal.writeln("\x1b[31mConnection closed\x1b[0m");
      setConnected(false);
      setConnectionMessage("Disconnected");
    };

    websocket.onerror = (error) => {
      terminal.writeln(`\x1b[31mWebSocket error: ${error.message}\x1b[0m`);
    };

    terminal.onData((data) => {
      websocket.send(data);
    });

    terminalRef.current = { terminal, fitAddon, websocket };

    // Handle resizing
    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      terminal.dispose();
      websocket.close();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      style={{
        height: isFullscreen ? "100vh" : "80vh",
        width: isFullscreen ? "100vw" : "80vw",
        margin: isFullscreen ? "0" : "5vh auto",
        border: "1px solid #333",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1E1E1E",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#333",
          padding: "10px 20px",
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Fancy Terminal</span>
        <span
          style={{
            fontSize: "0.9em",
            color: connected ? "#00FF00" : "#FF5555",
          }}
        >
          {connectionMessage}
        </span>
      </div>

      {/* Terminal Window */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          backgroundColor: "#1E1E1E",
          overflow: "hidden",
        }}
      ></div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#333",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          color: "#FFF",
        }}
      >
        <button
          onClick={toggleFullscreen}
          style={{
            backgroundColor: "#555",
            color: "#FFF",
            border: "none",
            borderRadius: "4px",
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <span>Terminal powered by xterm.js</span>
      </div>
    </div>
  );
};

export default App;
