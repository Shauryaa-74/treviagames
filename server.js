const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('Server running on ws://localhost:8080');

const players = new Map();

function randomColor() {
  const colors = ['#FF4C4C','#4CFF4C','#4C4CFF','#FFD700','#FF69B4','#00FFFF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on('connection', ws => {
  const id = Math.random().toString(36).slice(2, 10);
  const x = Math.random() * 700 + 50;
  const y = Math.random() * 500 + 50;
  const color = randomColor();

  players.set(id, { x, y, color });

  // Send init to the new client
  ws.send(JSON.stringify({ type: 'init', id, players: Array.from(players.entries()) }));

  // Notify others
  broadcast({ type: 'newPlayer', id, x, y, color });

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'move' && players.has(id)) {
        players.set(id, { x: data.x, y: data.y, color: players.get(id).color });
        broadcast({ type: 'move', id, x: data.x, y: data.y });
      }
    } catch (e) {
      console.error('Invalid JSON:', e);
    }
  });

  ws.on('close', () => {
    players.delete(id);
    broadcast({ type: 'removePlayer', id });
  });
});
