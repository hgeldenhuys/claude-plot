// watch.ts — File watcher for .plot/ directory with debounced callbacks
import fs from 'node:fs';
import path from 'node:path';

export type WatchCallback = () => void;

/**
 * Watch .plot/board/ and .plot/archive/ for changes.
 * Calls the callback when files are created, modified, or deleted.
 * Debounces rapid changes (e.g., multiple writes from a single Edit operation).
 */
export function watchPlot(plotDir: string, callback: WatchCallback, debounceMs = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const watchers: fs.FSWatcher[] = [];

  const debounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, debounceMs);
  };

  const dirs = [
    path.join(plotDir, 'board'),
    path.join(plotDir, 'archive'),
    path.join(plotDir, 'retros'),
  ];

  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const watcher = fs.watch(dir, { persistent: true }, (_event, filename) => {
        if (filename && (filename.endsWith('.md') || filename.endsWith('.yaml'))) {
          debounced();
        }
      });
      watchers.push(watcher);
    } catch {
      // directory doesn't exist, skip
    }
  }

  // Return cleanup function
  return () => {
    if (timer) clearTimeout(timer);
    for (const w of watchers) {
      w.close();
    }
  };
}
