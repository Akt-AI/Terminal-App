const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const port = 5000;

// Serve the HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Spawn a persistent shell session
  const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Send data from pty to client
  ptyProcess.on('data', (data) => {
    ws.send(data);
  });

  // Receive data from client and write to pty
  ws.on('message', (message) => {
    const msg = message.toString();

    if (msg.startsWith('RESIZE')) {
      const [_, cols, rows] = msg.split(' ');
      ptyProcess.resize(parseInt(cols, 10), parseInt(rows, 10));
    } else {
      ptyProcess.write(msg);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    ptyProcess.kill();
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    ptyProcess.kill();
  });
});

