#!/usr/bin/env node --import tsx
// board.tsx — Plot Board TUI with real-time updates
//
// Usage: node --import tsx tui/board.tsx [path-to-plot-dir]
//
// Watches .plot/ for file changes and updates the board in real-time.
// Navigate: j/k (up/down), Enter (drill in), Escape/[ (back), q (quit)

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { PanelStack, ListPanel, DetailPanel, TablePanel } from 'ink-panels';
import type { PanelConfig, PanelProps } from 'ink-panels';

// ListItem matches the shape expected by ListPanel (not exported from ink-panels)
interface ListItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
}
import path from 'node:path';
import { scanBoard, scanArchive, readConfig, type Story, type Task, type AC } from './parse.js';
import { watchPlot } from './watch.js';

// ─── Resolve .plot directory ─────────────────────────────

const plotDir = path.resolve(process.argv[2] || '.plot');

// ─── Colors ──────────────────────────────────────────────

const statusColors: Record<string, string> = {
  idea: 'cyan',
  planned: 'blue',
  active: 'yellow',
  verifying: 'magenta',
  done: 'green',
  archived: 'gray',
};

const priorityColors: Record<string, string> = {
  critical: 'red',
  high: 'yellow',
  medium: 'white',
  low: 'gray',
};

const taskStatusColors: Record<string, string> = {
  pending: 'gray',
  active: 'yellow',
  done: 'green',
  skip: 'gray',
};

const acStatusColors: Record<string, string> = {
  pending: 'gray',
  pass: 'green',
  fail: 'red',
};

// ─── Panel Factories ─────────────────────────────────────

function makeACDetailPanel(ac: AC, story: Story): PanelConfig {
  return {
    id: `ac-${story.id}-${ac.id}`,
    title: ac.id,
    component: DetailPanel as any,
    data: {
      title: `${ac.id}: ${ac.what}`,
      fields: [
        { label: 'Status', value: ac.status, color: acStatusColors[ac.status] },
        { label: 'Criterion', value: ac.what },
        { label: 'Proof', value: ac.proof || '(none yet)' },
        { label: '', value: '' },
        { label: 'Story', value: `${story.id}: ${story.title}` },
      ],
    },
    state: { type: 'ac-detail', storyId: story.id, acId: ac.id },
  };
}

function makeTaskDetailPanel(task: Task, story: Story): PanelConfig {
  return {
    id: `task-${story.id}-${task.id}`,
    title: task.id,
    component: DetailPanel as any,
    data: {
      title: `${task.id}: ${task.do}`,
      fields: [
        { label: 'Status', value: task.status, color: taskStatusColors[task.status] },
        { label: 'Role', value: task.role },
        { label: 'What', value: task.do },
        { label: 'Depends on', value: task.needs.length ? task.needs.join(', ') : '(none)' },
        { label: 'Covers', value: task.covers.join(', ') },
        { label: '', value: '' },
        { label: 'Story', value: `${story.id}: ${story.title}` },
      ],
    },
    state: { type: 'task-detail', storyId: story.id, taskId: task.id },
  };
}

function makeStoryDetailPanel(story: Story): PanelConfig {
  const acSummary = story.acceptance_criteria.length
    ? `${story.acceptance_criteria.filter(a => a.status === 'pass').length}/${story.acceptance_criteria.length} passing`
    : 'none';
  const taskSummary = story.tasks.length
    ? `${story.tasks.filter(t => t.status === 'done').length}/${story.tasks.length} done`
    : 'none';

  // Build items: ACs first, then tasks
  const items: ListItem[] = [];

  for (const ac of story.acceptance_criteria) {
    items.push({
      id: `ac:${ac.id}`,
      label: `${ac.id}: ${ac.what}`,
      badge: ac.status,
      badgeColor: acStatusColors[ac.status],
    });
  }

  if (story.tasks.length > 0) {
    // Separator via a disabled-looking item
    items.push({
      id: '__sep__',
      label: '── Tasks ──',
      description: taskSummary,
    });

    for (const task of story.tasks) {
      items.push({
        id: `task:${task.id}`,
        label: `${task.id}: ${task.do}`,
        description: `[${task.role}]`,
        badge: task.status,
        badgeColor: taskStatusColors[task.status],
      });
    }
  }

  return {
    id: `story-${story.id}`,
    title: story.id,
    component: ListPanel as any,
    data: {
      title: `${story.id}: ${story.title}`,
      items,
      onSelect: (item: ListItem, _idx: number, panelProps: PanelProps) => {
        if (item.id === '__sep__') return;
        if (item.id.startsWith('ac:')) {
          const acId = item.id.slice(3);
          const ac = story.acceptance_criteria.find(a => a.id === acId);
          if (ac) panelProps.push(makeACDetailPanel(ac, story));
        } else if (item.id.startsWith('task:')) {
          const taskId = item.id.slice(5);
          const task = story.tasks.find(t => t.id === taskId);
          if (task) panelProps.push(makeTaskDetailPanel(task, story));
        }
      },
    },
    state: {
      type: 'story-detail',
      storyId: story.id,
      title: story.title,
      status: story.status,
      acSummary,
      taskSummary,
    },
  };
}

// ─── Live Board Panel ────────────────────────────────────

function LiveBoardPanel(props: PanelProps<{ plotDir: string }>) {
  const { data, push, width, height } = props;
  const [stories, setStories] = useState<Story[]>([]);
  const [archived, setArchived] = useState<Story[]>([]);
  const [selected, setSelected] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showArchive, setShowArchive] = useState(false);

  const refresh = useCallback(() => {
    setStories(scanBoard(data.plotDir));
    setArchived(scanArchive(data.plotDir));
    setLastUpdate(new Date());
  }, [data.plotDir]);

  // Initial load + file watcher
  useEffect(() => {
    refresh();
    const cleanup = watchPlot(data.plotDir, refresh);
    return cleanup;
  }, [data.plotDir, refresh]);

  const activeList = showArchive ? archived : stories;
  const maxVisible = Math.max(1, height - 6); // header + footer + padding

  // Keep selection in bounds
  useEffect(() => {
    if (selected >= activeList.length) {
      setSelected(Math.max(0, activeList.length - 1));
    }
  }, [activeList.length, selected]);

  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      setSelected(s => Math.min(s + 1, activeList.length - 1));
    } else if (input === 'k' || key.upArrow) {
      setSelected(s => Math.max(s - 1, 0));
    } else if (input === 'g') {
      setSelected(0);
    } else if (input === 'G') {
      setSelected(activeList.length - 1);
    } else if (input === 'r') {
      refresh();
    } else if (input === 'a') {
      setShowArchive(v => !v);
      setSelected(0);
    } else if (key.return && activeList[selected]) {
      push(makeStoryDetailPanel(activeList[selected]));
    }
  });

  // Compute scroll window
  const scrollStart = Math.max(0, Math.min(selected - Math.floor(maxVisible / 2), activeList.length - maxVisible));
  const visible = activeList.slice(scrollStart, scrollStart + maxVisible);

  const config = readConfig(data.plotDir);

  // Stats
  const byStatus: Record<string, number> = {};
  for (const s of stories) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }

  return (
    <Box flexDirection="column" width={width}>
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          {config.project}
        </Text>
        <Text dimColor> — {showArchive ? 'Archive' : 'Board'}</Text>
        <Text dimColor> ({activeList.length} stories)</Text>
        <Text dimColor>{'  '}updated {lastUpdate.toLocaleTimeString()}</Text>
      </Box>

      {/* Status bar */}
      {!showArchive && (
        <Box gap={2}>
          {Object.entries(byStatus).map(([status, count]) => (
            <Text key={status} color={statusColors[status] || 'white'}>
              {status}: {count}
            </Text>
          ))}
        </Box>
      )}

      {/* Separator */}
      <Text dimColor>{'─'.repeat(Math.min(width, 80))}</Text>

      {/* Story list */}
      {activeList.length === 0 ? (
        <Box paddingTop={1}>
          <Text dimColor>
            {showArchive
              ? 'No archived stories yet.'
              : 'Board is empty. Use /plot-ideate to create a story.'}
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {visible.map((story, i) => {
            const globalIdx = scrollStart + i;
            const isSelected = globalIdx === selected;
            const acPassing = story.acceptance_criteria.filter(a => a.status === 'pass').length;
            const acTotal = story.acceptance_criteria.length;
            const tasksDone = story.tasks.filter(t => t.status === 'done').length;
            const tasksTotal = story.tasks.length;

            return (
              <Box key={story.id} gap={1}>
                <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                  {isSelected ? '▸' : ' '}
                </Text>
                <Text color={statusColors[story.status]} bold>
                  {story.status.padEnd(10)}
                </Text>
                <Text color={priorityColors[story.priority]}>
                  {story.priority.charAt(0).toUpperCase().padEnd(2)}
                </Text>
                <Text bold={isSelected} color={isSelected ? 'cyan' : 'white'}>
                  {story.id}
                </Text>
                <Text color={isSelected ? 'white' : undefined}>
                  {story.title.slice(0, width - 40)}
                </Text>
                {acTotal > 0 && (
                  <Text dimColor>
                    AC:{acPassing}/{acTotal}
                  </Text>
                )}
                {tasksTotal > 0 && (
                  <Text dimColor>
                    T:{tasksDone}/{tasksTotal}
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          j/k:navigate  Enter:open  a:{showArchive ? 'board' : 'archive'}  r:refresh  q:quit
        </Text>
      </Box>
    </Box>
  );
}

// ─── Launch ──────────────────────────────────────────────

const initialPanel: PanelConfig = {
  id: 'board',
  title: 'Board',
  component: LiveBoardPanel as any,
  data: { plotDir },
  state: { type: 'board' },
};

const { unmount } = render(
  <PanelStack
    appName="plot-board"
    initialPanel={initialPanel}
    onExit={() => {
      unmount();
      process.exit(0);
    }}
  />,
);
