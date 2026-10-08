// The chat's messages in SQLite (node:sqlite, built into Node.js): no native module, so the image stays small.
import { DatabaseSync } from 'node:sqlite';

export interface Message {
  id: number;
  /** The Pithyx user name of the sender, as the box's proxy names it (X-Pithyx-User). */
  user: string;
  text: string;
  /** UTC, ISO 8601. */
  sentAt: string;
}

/** The longest message in characters. */
export const MAX_LENGTH = 2000;

/** The text to store, trimmed, or null when it is empty or too long. */
export function cleanText(text: unknown): string | null {
  if (typeof text !== 'string') {
    return null;
  }
  const trimmed = text.trim();
  return trimmed.length === 0 || trimmed.length > MAX_LENGTH ? null : trimmed;
}

export class MessageStore {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, user TEXT NOT NULL, text TEXT NOT NULL, sent_at TEXT NOT NULL)',
    );
  }

  /** Stores a message and returns it with its id. */
  add(user: string, text: string, sentAt: Date = new Date()): Message {
    const result = this.db
      .prepare('INSERT INTO messages (user, text, sent_at) VALUES (?, ?, ?)')
      .run(user, text, sentAt.toISOString());
    return { id: Number(result.lastInsertRowid), user, text, sentAt: sentAt.toISOString() };
  }

  /** The newest `limit` messages after `afterId`, oldest first. */
  list(afterId = 0, limit = 100): Message[] {
    const rows = this.db
      .prepare(
        'SELECT id, user, text, sent_at AS sentAt FROM (SELECT * FROM messages WHERE id > ? ORDER BY id DESC LIMIT ?) ORDER BY id',
      )
      .all(afterId, limit) as unknown as Message[];
    return rows.map((row) => ({ id: Number(row.id), user: row.user, text: row.text, sentAt: row.sentAt }));
  }

  close(): void {
    this.db.close();
  }
}
