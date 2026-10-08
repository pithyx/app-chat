/** What the chat does with a new message: nothing while the user looks at it, else count it and say so. */
export interface Arrival {
  /** The unread count afterwards, for the taskbar badge (null removes the badge). */
  badge: number | null;
  /** Whether to show a notification. */
  notify: boolean;
}

/**
 * A message arrives: the user's own message never counts; while the window is visible nothing counts, otherwise the
 * count grows and a notification goes out.
 */
export function arrive(unread: number, fromSelf: boolean, visible: boolean): Arrival {
  if (fromSelf || visible) {
    return { badge: unread === 0 ? null : unread, notify: false };
  }
  return { badge: unread + 1, notify: true };
}

/** The name to show for a user name: the display name from the directory, else the user name. */
export function displayName(user: string, directory: ReadonlyMap<string, string | null>): string {
  const display = directory.get(user)?.trim();
  return display !== undefined && display !== '' ? display : user;
}
