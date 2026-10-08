import type { PithyxApp } from '@pithyx/sdk';
import { createI18n } from '@pithyx/sdk/i18n';
import { Button, TextField } from '@pithyx/ui';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import de from '../i18n/de.json';
import en from '../i18n/en.json';
import { arrive, displayName } from './unread';

interface Message {
  id: number;
  user: string;
  text: string;
  sentAt: string;
}

const RECONNECT_MS = 3000;

export function Chat({ app }: { app: PithyxApp }) {
  const i18n = useMemo(() => createI18n(app, { en, de }), [app]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [online, setOnline] = useState(true);
  const [directory, setDirectory] = useState<ReadonlyMap<string, string | null>>(new Map());
  const unread = useRef(0);
  // Read by the socket's handler, so a loaded directory does not open the socket again.
  const names = useRef(directory);
  names.current = directory;
  const me = app.context.user.name;

  // Users and their display names; only with directory.read, which an administrator may revoke.
  useEffect(() => {
    if (!app.context.permissions.includes('directory.read')) {
      return;
    }
    void app.directory
      .users()
      .then((users) => setDirectory(new Map(users.map((user) => [user.name, user.displayName]))))
      .catch(() => setDirectory(new Map()));
  }, [app]);

  // The history, then every new message over the WebSocket; a lost socket reconnects and fetches what it missed.
  useEffect(() => {
    let socket: WebSocket | null = null;
    let stopped = false;
    let lastId = 0;
    const add = (incoming: Message[]) => {
      if (incoming.length === 0) {
        return;
      }
      lastId = Math.max(lastId, ...incoming.map((message) => message.id));
      setMessages((current) => {
        const known = new Set(current.map((message) => message.id));
        return [...current, ...incoming.filter((message) => !known.has(message.id))];
      });
    };
    const open = async () => {
      try {
        const response = await app.backend.fetch(`/messages?after=${String(lastId)}`);
        add((await response.json()) as Message[]);
        socket = await app.backend.socket('/live');
        setOnline(true);
        socket.addEventListener('message', (event) => {
          const message = (JSON.parse(String(event.data)) as { message: Message }).message;
          add([message]);
          const result = arrive(unread.current, message.user === me, app.context.visible);
          unread.current = result.badge ?? 0;
          void app.setBadge(result.badge);
          if (result.notify) {
            void app.notify({
              title: i18n.t('notification.title', { name: displayName(message.user, names.current) }),
              body: message.text,
              actions: [{ id: 'reply', label: i18n.t('notification.reply') }],
              tag: 'chat',
            });
          }
        });
        socket.addEventListener('close', () => {
          if (!stopped) {
            setOnline(false);
            setTimeout(() => void open(), RECONNECT_MS);
          }
        });
      } catch {
        setOnline(false);
        if (!stopped) {
          setTimeout(() => void open(), RECONNECT_MS);
        }
      }
    };
    void open();
    return () => {
      stopped = true;
      socket?.close();
    };
  }, [app, i18n, me]);

  // Seen once the window shows again; a click on "Reply" in a notification puts the cursor in the input.
  useEffect(() => {
    const stops = [
      app.on('visibilityChange', ({ visible }) => {
        if (visible) {
          unread.current = 0;
          void app.setBadge(null);
        }
      }),
      app.on('notificationAction', () => document.querySelector<HTMLInputElement>('.draft input')?.focus()),
    ];
    void app.window.setTitle(i18n.t('title'));
    return () => stops.forEach((stop) => stop());
  }, [app, i18n]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (text === '') {
      return;
    }
    const response = await app.backend.fetch('/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (response.ok) {
      setDraft('');
    }
  };

  return (
    <div className="chat">
      {!online && (
        <p className="status" role="status">
          {i18n.t(app.context.backend?.status === 'starting' ? 'backend.starting' : 'backend.unavailable')}
        </p>
      )}
      <ol className="messages" aria-live="polite">
        {messages.length === 0 && <li className="muted">{i18n.t('empty')}</li>}
        {messages.map((message) => (
          <li key={message.id} className={message.user === me ? 'mine' : undefined}>
            <span className="from">{message.user === me ? i18n.t('you') : displayName(message.user, directory)}</span>
            <time dateTime={message.sentAt}>{app.format.time(new Date(message.sentAt))}</time>
            <p>{message.text}</p>
          </li>
        ))}
      </ol>
      <form className="compose" onSubmit={(event) => void send(event)}>
        <TextField
          label={i18n.t('placeholder')}
          placeholder={i18n.t('placeholder')}
          value={draft}
          onChange={setDraft}
          className="draft"
        />
        <Button type="submit" variant="primary" isDisabled={draft.trim() === ''}>
          {i18n.t('send')}
        </Button>
      </form>
    </div>
  );
}
