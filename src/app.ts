import { exerciseById, EXERCISES, type Exercise } from '../exercises';
import { todayKey } from './lib/daily';
import { displayDone, recordLibraryCompletion } from './lib/library-bonus';
import {
  ensureDayState,
  getCachedDayState,
  getDraftField,
  loadDraftFields,
  markDailyComplete,
  saveDraft,
  type DayState,
} from './lib/storage';

type View = 'home' | 'daily' | 'library-list' | 'library';

let view: View = 'home';
let activeId: string | null = null;
let activeScope: 'daily' | 'library' = 'daily';
let dayState: DayState | null = null;
let ready = false;

const root = document.getElementById('app')!;

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function instructionsHtml(text: string): string {
  return esc(text).replace(/\n/g, '<br>');
}

function renderLoading(): void {
  root.innerHTML = '<p class="lede">…</p>';
}

function renderError(msg: string): void {
  root.innerHTML = `<section class="home"><p class="lede">${esc(msg)}</p><button type="button" class="primary block" id="retry-btn">Retry</button></section>`;
  document.getElementById('retry-btn')?.addEventListener('click', () => { void boot(); });
}

function renderExercise(ex: Exercise, scope: 'daily' | 'library'): string {
  const fields = ex.fields.map((f) => {
    const val = esc(getDraftField(ex.id, f.id, scope));
    const tag = f.multiline
      ? `<textarea id="f-${f.id}" rows="${Math.min(8, Math.max(3, f.label.length / 24))}" placeholder="${esc(f.placeholder ?? '')}">${val}</textarea>`
      : `<input id="f-${f.id}" type="text" value="${val}" placeholder="${esc(f.placeholder ?? '')}" />`;
    return `<label class="field"><span>${esc(f.label)}</span>${tag}</label>`;
  }).join('');

  const back = scope === 'daily' ? 'home' : 'library-list';
  const doneLabel = scope === 'daily' ? 'Complete' : 'Done';

  return `
    <article class="exercise">
      <p class="meta">${scope === 'daily' ? 'Today' : 'Library'}</p>
      <h1>${esc(ex.title)}</h1>
      <div class="instructions">${instructionsHtml(ex.instructions)}</div>
      <form id="ex-form" class="fields">${fields}</form>
      <div class="actions">
        <button type="button" class="ghost" data-nav="${back}">Back</button>
        <button type="button" class="primary" id="done-btn">${doneLabel}</button>
      </div>
    </article>
  `;
}

function renderHome(): string {
  const state = dayState ?? getCachedDayState();
  if (!state) return '<p class="lede">…</p>';
  const total = state.assignedIds.length;
  const done = displayDone(state.completedIds.length, state.dateKey);

  if (state.dailyComplete) {
    return `
      <section class="home">
        <h1>Today</h1>
        <p class="lede">Daily practice complete (${done}/${total}).</p>
        <button type="button" class="primary block" data-nav="library-list">Library</button>
      </section>
    `;
  }

  const next = state.nextId ? exerciseById(state.nextId) : null;
  const title = next?.title ?? 'Practice';

  return `
    <section class="home">
      <h1>Today</h1>
      <p class="lede">${done} of ${total} complete</p>
      <button type="button" class="primary block" data-nav="daily" data-id="${esc(state.nextId ?? '')}">${esc(title)}</button>
    </section>
  `;
}

function renderLibraryList(): string {
  const items = EXERCISES.map((e) =>
    `<button type="button" class="list-item" data-nav="library" data-id="${esc(e.id)}">${esc(e.title)}</button>`
  ).join('');

  return `
    <section class="library">
      <h1>Library</h1>
      <p class="lede">Free practice. Each completion boosts today's count.</p>
      <nav class="list">${items}</nav>
      <button type="button" class="ghost block" data-nav="home">Back</button>
    </section>
  `;
}

function paint(): void {
  if (!ready) { renderLoading(); return; }

  let html = '';
  if (view === 'home') html = renderHome();
  else if (view === 'library-list') html = renderLibraryList();
  else if ((view === 'daily' || view === 'library') && activeId) {
    const ex = exerciseById(activeId);
    if (!ex) { view = 'home'; html = renderHome(); }
    else html = renderExercise(ex, activeScope);
  } else html = renderHome();

  root.innerHTML = html;
  bind();
}

async function openExercise(id: string, scope: 'daily' | 'library'): Promise<void> {
  view = scope === 'daily' ? 'daily' : 'library';
  activeScope = scope;
  activeId = id;
  paint();
  await loadDraftFields(id, scope);
  paint();
}

function bindForm(ex: Exercise, scope: 'daily' | 'library'): void {
  for (const f of ex.fields) {
    const el = document.getElementById(`f-${f.id}`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) continue;
    el.addEventListener('input', () => saveDraft(ex.id, f.id, scope, el.value));
  }
  document.getElementById('done-btn')?.addEventListener('click', () => {
    void (async () => {
      if (scope === 'daily') {
        dayState = await markDailyComplete(ex.id);
      } else {
        recordLibraryCompletion(dayState?.dateKey ?? todayKey());
      }
      view = scope === 'daily' ? 'home' : 'library-list';
      activeId = null;
      paint();
    })();
  });
}

function bind(): void {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      const nav = (el as HTMLElement).dataset.nav as View;
      const id = (el as HTMLElement).dataset.id;
      if (nav === 'daily' && id) { void openExercise(id, 'daily'); return; }
      if (nav === 'library' && id) { void openExercise(id, 'library'); return; }
      view = nav;
      activeId = null;
      paint();
    });
  });

  if ((view === 'daily' || view === 'library') && activeId) {
    const ex = exerciseById(activeId);
    if (ex) bindForm(ex, activeScope);
  }
}

async function refreshDay(): Promise<void> {
  dayState = await ensureDayState();
}

function refreshDayIfDateChanged(): void {
  if (!ready) return;
  const key = todayKey();
  if (dayState?.dateKey === key) return;
  void refreshDay().then(() => paint()).catch(() => {});
}

export async function boot(): Promise<void> {
  ready = false;
  paint();
  try {
    await refreshDay();
    ready = true;
    paint();
  } catch {
    renderError('Could not reach the server. Check your connection and retry.');
  }
}

export function initApp(): void {
  void boot();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshDayIfDateChanged();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshDayIfDateChanged();
  });
}
