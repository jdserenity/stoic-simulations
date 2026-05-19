import { initApp } from './app';
import { migrateLocalStorageIfNeeded } from './lib/migrate-local';
import './styles.css';

async function start(): Promise<void> {
  try {
    await migrateLocalStorageIfNeeded();
    initApp();
  } catch {
    const root = document.getElementById('app');
    if (root) root.textContent = 'Could not connect. Check network and retry.';
  }
}

void start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
