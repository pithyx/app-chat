// A team chat: messages from the app's backend, live over a WebSocket, with notifications and an unread badge.
import { connect } from '@pithyx/sdk';
import { UiProvider } from '@pithyx/ui';
import '@pithyx/ui/tokens.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import en from '../i18n/en.json';
import { Chat } from './Chat';
import './style.css';

const element = document.querySelector<HTMLElement>('#app')!;

try {
  const app = await connect();
  element.removeAttribute('aria-busy');
  createRoot(element).render(
    <StrictMode>
      <UiProvider locale={app.context.locale}>
        <Chat app={app} />
      </UiProvider>
    </StrictMode>,
  );
} catch {
  element.removeAttribute('aria-busy');
  element.textContent = en.noDesktop;
}
