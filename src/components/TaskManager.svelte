<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  type Task = { id: string; title: string; done: boolean; createdAt: number };
  type Filter = 'all' | 'active' | 'done';

  const STORAGE_KEY = 'task-manager:tasks';

  let tasks = $state<Task[]>([]);
  let filter = $state<Filter>('all');
  let draft = $state('');
  let editingId = $state<string | null>(null);
  let editDraft = $state('');
  let loaded = $state(false);

  const visible = $derived(
    tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done))
  );
  const remaining = $derived(tasks.filter((t) => !t.done).length);
  const completed = $derived(tasks.length - remaining);

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) tasks = JSON.parse(raw);
    } catch {
      // Storage unavailable or corrupt: start empty
    }
    loaded = true;
  });

  $effect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage unavailable (e.g. private mode): keep working in memory
    }
  });

  function add(event: SubmitEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    tasks.unshift({ id: crypto.randomUUID(), title, done: false, createdAt: Date.now() });
    draft = '';
  }

  function toggle(task: Task) {
    task.done = !task.done;
  }

  function remove(id: string) {
    tasks = tasks.filter((t) => t.id !== id);
  }

  function startEdit(task: Task) {
    editingId = task.id;
    editDraft = task.title;
  }

  function commitEdit(task: Task) {
    const title = editDraft.trim();
    if (title) task.title = title;
    else remove(task.id);
    editingId = null;
  }

  function onEditKey(event: KeyboardEvent, task: Task) {
    if (event.key === 'Enter') commitEdit(task);
    if (event.key === 'Escape') editingId = null;
  }

  function clearCompleted() {
    tasks = tasks.filter((t) => !t.done);
  }

  function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
  }
</script>

<section class="card">
  <form onsubmit={add}>
    <input
      class="new"
      placeholder="What needs to be done?"
      bind:value={draft}
      aria-label="New task"
      maxlength="200"
    />
    <button type="submit" class="add" disabled={!draft.trim()} aria-label="Add task">+</button>
  </form>

  <nav class="filters" aria-label="Filter tasks">
    {#each ['all', 'active', 'done'] as const as f (f)}
      <button class:active={filter === f} onclick={() => (filter = f)} aria-pressed={filter === f}>
        {f}
      </button>
    {/each}
  </nav>

  {#if loaded && visible.length === 0}
    <p class="empty" in:fade>
      {#if tasks.length === 0}
        Nothing here yet. Add your first task ✨
      {:else if filter === 'done'}
        No completed tasks yet.
      {:else}
        All done. Nice work 🎉
      {/if}
    </p>
  {/if}

  <ul>
    {#each visible as task (task.id)}
      <li
        class:done={task.done}
        animate:flip={{ duration: 250 }}
        in:fly={{ y: -12, duration: 200 }}
        out:fly={{ x: 40, duration: 200 }}
      >
        <button
          class="check"
          onclick={() => toggle(task)}
          aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
          aria-pressed={task.done}
        >
          {#if task.done}✓{/if}
        </button>

        {#if editingId === task.id}
          <input
            class="edit"
            bind:value={editDraft}
            onkeydown={(e) => onEditKey(e, task)}
            onblur={() => commitEdit(task)}
            aria-label="Edit task"
            maxlength="200"
            use:autofocus
          />
        {:else}
          <span class="title" ondblclick={() => startEdit(task)} role="presentation">{task.title}</span>
          <button class="icon" onclick={() => startEdit(task)} aria-label="Edit task">✎</button>
        {/if}

        <button class="icon delete" onclick={() => remove(task.id)} aria-label="Delete task">✕</button>
      </li>
    {/each}
  </ul>

  {#if tasks.length > 0}
    <div class="footer">
      <span>{remaining} {remaining === 1 ? 'task' : 'tasks'} left</span>
      {#if completed > 0}
        <button class="link" onclick={clearCompleted}>Clear completed ({completed})</button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.25rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
  form {
    display: flex;
    gap: 0.5rem;
  }
  input {
    font: inherit;
    color: var(--text);
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.85rem 1rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-width: 0;
  }
  input:focus {
    border-color: var(--c4);
    box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.15);
  }
  input::placeholder { color: var(--muted); }
  .new { flex: 1; font-size: 1.05rem; }
  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    cursor: pointer;
  }
  .add {
    width: 3.25rem;
    flex-shrink: 0;
    border-radius: 12px;
    font-size: 1.6rem;
    font-weight: 700;
    color: #07060f;
    background: linear-gradient(135deg, var(--c1), var(--c3));
    transition: transform 0.15s, opacity 0.2s;
  }
  .add:hover:not(:disabled) { transform: scale(1.06); }
  .add:disabled { opacity: 0.35; cursor: default; }

  .filters {
    display: flex;
    gap: 0.25rem;
    margin: 1rem 0 0.5rem;
    padding: 0.25rem;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    width: fit-content;
  }
  .filters button {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    font-size: 0.85rem;
    text-transform: capitalize;
    color: var(--muted);
    transition: background 0.2s, color 0.2s;
  }
  .filters button:hover { color: var(--text); }
  .filters button.active {
    color: var(--text);
    background: rgba(255, 255, 255, 0.1);
  }

  ul { list-style: none; }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.25rem;
    border-bottom: 1px solid var(--border);
  }
  li:last-child { border-bottom: none; }

  .check {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--muted);
    display: grid;
    place-items: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #07060f;
    transition: all 0.2s;
  }
  .check:hover { border-color: var(--c4); }
  li.done .check {
    border-color: transparent;
    background: linear-gradient(135deg, var(--c4), var(--c3));
    box-shadow: 0 0 12px rgba(0, 245, 212, 0.5);
  }

  .title {
    flex: 1;
    overflow-wrap: anywhere;
    transition: color 0.2s;
  }
  li.done .title {
    color: var(--muted);
    text-decoration: line-through;
    text-decoration-color: var(--c1);
  }
  .edit { flex: 1; padding: 0.4rem 0.6rem; }

  .icon {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    border-radius: 8px;
    color: var(--muted);
    opacity: 0;
    transition: opacity 0.15s, color 0.15s, background 0.15s;
  }
  li:hover .icon,
  li:focus-within .icon { opacity: 1; }
  .icon:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); }
  .delete:hover { color: var(--c1); }
  @media (hover: none) {
    .icon { opacity: 1; }
  }

  .empty {
    text-align: center;
    padding: 2rem 0 1.25rem;
    color: var(--muted);
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 0.85rem;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .link:hover { color: var(--c1); }
</style>
