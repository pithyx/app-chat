// Puts a pushed image's digest into backend/compose.yaml and writes backend/images.lock.json with `pithyx lock`.
//
//   npm run pin -- ghcr.io/<owner>/app-chat-server:<version>@sha256:<digest>
//
// The shared CI's manual run with `publish-image` pushes the image and prints its digest.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const reference = process.argv[2] ?? '';
if (!/^\S+:[^@\s]+@sha256:[a-f0-9]{64}$/.test(reference)) {
  console.error('usage: npm run pin -- <name>:<tag>@sha256:<digest>');
  process.exit(2);
}
const file = 'backend/compose.yaml';
const compose = readFileSync(file, 'utf8');
const pinned = compose.replace(/^(\s+image: )\S+$/m, `$1${reference}`);
if (pinned === compose) {
  console.error(`${file} has no image line to replace`);
  process.exit(1);
}
writeFileSync(file, pinned);
execFileSync('npx', ['pithyx', 'lock'], { stdio: 'inherit' });
