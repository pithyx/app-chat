// The chat's backend: a small HTTP server with a WebSocket, behind the Pithyx box's proxy. The proxy checks the user's
// token and tells the backend who it is (X-Pithyx-User and friends), so the backend has no sign-in of its own and
// trusts those headers: nothing but the proxy can reach it, since backends have no ports on the host.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import { cleanText, MessageStore } from './messages.ts';

const port = Number(process.env.PORT ?? 8080);
const store = new MessageStore(join(process.env.DATA_DIR ?? '/data', 'chat.db'));
const live = new WebSocketServer({ noServer: true });

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

/** The signed-in user the proxy names; every request through the box has one. */
function userOf(request: IncomingMessage): string | null {
  const user = request.headers['x-pithyx-user'];
  return typeof user === 'string' && user !== '' ? user : null;
}

async function bodyOf(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > 16 * 1024) {
      throw new Error('too large');
    }
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = createServer((request, response) => {
  void handle(request, response).catch(() => send(response, 400, { error: 'bad request' }));
});

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://backend');
  if (url.pathname === '/healthz') {
    send(response, 200, { ok: true });
    return;
  }
  const user = userOf(request);
  if (user === null) {
    send(response, 401, { error: 'no user' });
    return;
  }
  if (url.pathname === '/messages' && request.method === 'GET') {
    send(response, 200, store.list(Number(url.searchParams.get('after') ?? 0) || 0));
    return;
  }
  if (url.pathname === '/messages' && request.method === 'POST') {
    const body = (await bodyOf(request)) as { text?: unknown } | null;
    const text = cleanText(body?.text);
    if (text === null) {
      send(response, 400, { error: 'empty or too long' });
      return;
    }
    const message = store.add(user, text);
    const event = JSON.stringify({ type: 'message', message });
    for (const client of live.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(event);
      }
    }
    send(response, 201, message);
    return;
  }
  send(response, 404, { error: 'not found' });
}

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '/', 'http://backend');
  if (url.pathname !== '/live' || userOf(request) === null) {
    socket.destroy();
    return;
  }
  live.handleUpgrade(request, socket, head, (client) => live.emit('connection', client, request));
});

server.listen(port, () => {
  console.log(JSON.stringify({ level: 'info', msg: `chat backend listening on ${String(port)}` }));
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close();
    store.close();
    process.exit(0);
  });
}
