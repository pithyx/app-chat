# Pithyx app: chat

A team chat as a [Pithyx](https://github.com/pithyx/pithyx) app: a React frontend with `@pithyx/ui` and a Node.js
backend with a WebSocket and SQLite in a volume. It shows the parts most apps need:

Part of Pithyx by Schecher1 (https://github.com/Schecher1).

- **A backend** (`backend/`): one service, reached only through the box's proxy at `/apps/<id>/api/`. The proxy checks
  the user's token and names the user in `X-Pithyx-User`, so the backend has no sign-in of its own
  (`backend/server/src/server.ts`). Messages live in SQLite in the named volume `data`, a folder of the app's dataset
  on the box (`backend/server/src/messages.ts`).
- **Live updates**: `app.backend.socket('/live')` opens a WebSocket with a one-time ticket; it reconnects and fetches
  what it missed.
- **Users**: with `directory.read`, the chat shows display names (`app.directory.users()`).
- **Notifications with an action** and **the unread badge** while the window is hidden (`src/unread.ts`).

## Start

You need Node.js 24 or newer and Docker.

```sh
npm install
npm run dev            # the mock desktop of pithyx dev; the backend runs with docker compose from backend/compose.dev.yaml
npm run build:backend  # pithyx build: builds backend/server and writes backend/compose.yaml and images.lock.json
npm test               # type check, build, pithyx validate and the unit tests of frontend and backend
npm run pack           # writes <id>-<version>.pithyxapp with the backend image inside
```

`pithyx build` needs `@pithyx/cli` 1.0.0-rc.5 or newer.

## The backend

`backend/compose.dev.yaml` is the backend's source form: the service `server` is built from `backend/server`, whose
`FROM` is pinned by digest. The box never builds anything; it runs `backend/compose.yaml`, which names the image by
digest, with `backend/images.lock.json` naming it per architecture. Both are written by a build, never by hand, and
are not committed. There are two ways to bring the app to a box:

- **A catalog** (the way for everybody else's boxes): open a pull request that adds the app's source as
  `apps/<id>/` to a catalog repository, for example `pithyx/apps-community` (see its CONTRIBUTING.md). After the
  review, the catalog's CI builds the frontend and the images from the merged commit, pushes the images to its
  registry, pins them by digest and publishes the package; boxes install it from the Store and get its updates.
- **A sideload** (for your own box and for testing): `npm run pack` runs `pithyx build`, which builds the image for
  your machine and tags it `pithyx.local/com.example.chat/server:<version>`, and `pithyx pack --images`, which puts the
  image into the package. Install the `.pithyxapp` in the Store (gear, Install from file). Such a package carries the
  image of one architecture and is marked unverified.

The CI of this repository does the sideload build on every push and attaches the package to a GitHub release.
## License

MIT
