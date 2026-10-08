# Pithyx app: chat

A team chat as a [Pithyx](https://github.com/pithyx/pithyx) app: a React frontend with `@pithyx/ui` and a Node.js
backend with a WebSocket and SQLite in a volume. It shows the parts most apps need:

- **A backend** (`backend/`): one service, reached only through the box's proxy at `/apps/<id>/api/`. The proxy checks
  the user's token and names the user in `X-Pithyx-User`, so the backend has no sign-in of its own
  (`backend/server/src/server.ts`). Messages live in SQLite in the named volume `data`, a folder of the app's dataset
  on the box (`backend/server/src/messages.ts`).
- **Live updates**: `app.backend.socket('/live')` opens a WebSocket with a one-time ticket; it reconnects and fetches
  what it missed.
- **Users**: with `directory.read`, the chat shows display names (`app.directory.users()`).
- **Notifications with an action** and **the unread badge** while the window is hidden (`src/unread.ts`).

## Start

```sh
npm install
npm run dev     # the mock desktop of pithyx dev; the backend runs with docker compose, built from backend/server
npm test        # type check, build, pithyx validate and the unit tests of frontend and backend
npm run pack    # writes <id>-<version>.pithyxapp
```

`npm run dev` needs Docker. `backend/compose.dev.yaml` builds the server from its source for development; the box
always runs the published image.

## The backend image

The box never builds anything: `backend/compose.yaml` names the server's image by digest, and
`backend/images.lock.json` names its image per architecture. Until the first image is published, `npm test` stops at
`cli.lock.missing`. For a release:

1. Run the CI workflow by hand with "publish-image": it builds `backend/server` for amd64 and arm64 and pushes
   `ghcr.io/<owner>/app-chat-server:<version>`.
2. `npm run pin -- ghcr.io/<owner>/app-chat-server:<version>@sha256:<digest>` puts the digest into
   `backend/compose.yaml` and writes the lock with `pithyx lock`.
3. Commit both, publish a GitHub release; the CI attaches the `.pithyxapp`.

## License

MIT
