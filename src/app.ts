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
import type { DailyMeditationsDto } from '../shared/api-types';
import { getClientId } from './lib/client-id';
import { copyText } from './lib/copy-text';
import {
  addMeditation,
  deleteMeditation,
  ensureDailyMeditations,
  getCachedDailyMeditations,
} from './lib/meditations';

type View = 'home' | 'daily' | 'library-list' | 'library' | 'settings';

let view: View = 'home';
let activeId: string | null = null;
let activeScope: 'daily' | 'library' = 'daily';
let dayState: DayState | null = null;
let dailyMeds: DailyMeditationsDto | null = null;
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

  const meds = dailyMeds?.items?.length
    ? `<div class="meds">${
        dailyMeds.items.map((m) =>
          `<div class="meditation" data-med-id="${esc(m.id)}"><div class="meditation-text">${esc(m.text)}</div></div>`
        ).join('')
      }</div>`
    : '';

  return `
    <section class="home">
      <div class="exercises">
        <h1>Today</h1>
        <p class="lede">${done} of ${total} complete</p>
        <button type="button" class="primary block" data-nav="daily" data-id="${esc(state.nextId ?? '')}">${esc(title)}</button>
      </div>
      ${meds}
      <button type="button" class="ghost block" data-nav="settings">Save from X</button>
    </section>
  `;
}

function renderSettings(): string {
  const id = getClientId();
  const apiUrl = `${window.location.origin}/api/meditations`;
  return `
    <section class="settings">
      <h1>Save from X</h1>
      <p class="lede">iOS does not let PWAs appear in the share sheet. Use a personal Shortcut instead.</p>
      <p class="meta">Device ID</p>
      <p class="client-id">${esc(id)}</p>
      <button type="button" class="primary block" id="copy-client-id">Copy ID</button>
      <p class="lede setup-steps">One-time setup: Shortcuts → + → ⓘ Details → <strong>Show in Share Sheet</strong> (no “Receive” action — iOS adds an input block at the top). Limit types to Text + URLs. Add <strong>Get Contents of URL</strong> POST to <span class="mono">${esc(apiUrl)}</span> with headers <span class="mono">Content-Type</span>, <span class="mono">X-Client-Id</span>, <span class="mono">X-Local-Date</span> (<span class="mono">yyyy-MM-dd</span>), body <span class="mono">{"text":"…"}</span> using variable <span class="mono">Shortcut Input</span>.</p>
      <form id="add-med-form" class="fields">
        <p class="meta">Or add manually</p>
        <label class="field"><span>Text</span><textarea id="med-text" rows="4" placeholder="Paste post text"></textarea></label>
        <label class="field"><span>URL (optional)</span><input id="med-url" type="text" placeholder="https://x.com/…" /></label>
        <button type="submit" class="primary block">Save meditation</button>
      </form>
      <button type="button" class="ghost block" data-nav="home">Back</button>
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
  else if (view === 'settings') html = renderSettings();
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

  if (view === 'settings') bindSettings();

  root.querySelectorAll('.meditation').forEach((el) => {
    const id = (el as HTMLElement).dataset.medId;
    if (!id) return;

    let holdTimer: number | null = null;

    const startHold = (e: Event) => {
      e.preventDefault();
      (el as HTMLElement).classList.add('holding');
      holdTimer = window.setTimeout(() => {
        const card = el as HTMLElement;
        const textEl = card.querySelector('.meditation-text');
        const originalText = textEl ? textEl.textContent || '' : '';
        card.classList.remove('holding');
        card.classList.add('confirming');
        card.innerHTML = `
          <div class="meditation-text" style="margin-bottom:0.5rem;opacity:0.85;font-size:0.95rem;">${esc(originalText)}</div>
          <div style="font-size:0.85rem;margin-bottom:0.6rem;">Are you sure you want to delete this meditation?</div>
          <div style="display:flex;gap:0.5rem;">
            <button type="button" class="ghost" style="flex:1;font-size:0.85rem;padding:0.4rem 0;" data-action="cancel">Cancel</button>
            <button type="button" class="primary" style="flex:1;font-size:0.85rem;padding:0.4rem 0;background:#a33;color:#fff;" data-action="delete">Delete</button>
          </div>
        `;
        const cancelBtn = card.querySelector('[data-action="cancel"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => paint());
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            try {
              dailyMeds = await deleteMeditation(id);
              paint();
            } catch {
              paint();
            }
          });
        }
      }, 750);
    };

    const endHold = () => {
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      (el as HTMLElement).classList.remove('holding');
    };

    el.addEventListener('mousedown', startHold);
    el.addEventListener('mouseup', endHold);
    el.addEventListener('mouseleave', endHold);
    el.addEventListener('touchstart', startHold, { passive: false });
    el.addEventListener('touchend', endHold);
    el.addEventListener('touchcancel', endHold);
  });
}

function bindSettings(): void {
  document.getElementById('copy-client-id')?.addEventListener('click', () => {
    void copyText(getClientId()).then((ok) => {
      const btn = document.getElementById('copy-client-id');
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      window.setTimeout(() => { btn.textContent = prev; }, 1500);
    });
  });
  document.getElementById('add-med-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (document.getElementById('med-text') as HTMLTextAreaElement | null)?.value ?? '';
    const url = (document.getElementById('med-url') as HTMLInputElement | null)?.value ?? '';
    void (async () => {
      try {
        await addMeditation({ text: text.trim(), url: url.trim() || undefined });
        dailyMeds = await ensureDailyMeditations();
        view = 'home';
        paint();
      } catch { /* leave form filled */ }
    })();
  });
}

async function refreshDay(): Promise<void> {
  dayState = await ensureDayState();
}

async function refreshMeds(): Promise<void> {
  dailyMeds = await ensureDailyMeditations();
}

function refreshDayIfDateChanged(): void {
  if (!ready) return;
  const key = todayKey();
  if (dayState?.dateKey === key) return;
  void refreshDay().then(() => refreshMeds().then(() => paint()).catch(() => {})).catch(() => {});
}

export async function boot(): Promise<void> {
  ready = false;
  paint();
  try {
    await refreshDay();
    await refreshMeds();
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
