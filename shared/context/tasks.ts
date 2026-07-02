import type { Store, Task } from '../types.js';

export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  depth: number;
}

export async function createSubTask(
  store: Store,
  parentTaskId: string,
  input: Omit<Task, 'id' | 'parentTaskId' | 'subTaskIds' | 'createdAt'>,
): Promise<Task> {
  const parent = await store.getTask(parentTaskId);
  if (!parent) throw new Error(`Parent task not found: ${parentTaskId}`);

  const siblings = parent.subTaskIds?.length ?? 0;
  const id = `${parentTaskId}.${siblings + 1}`;

  const task: Task = {
    ...input,
    id,
    parentTaskId,
    subTaskIds: [],
    status: 'pending',
    createdAt: Date.now(),
  };

  await store.saveTask(task);

  // 更新父任务的 subTaskIds
  const updatedParent: Task = {
    ...parent,
    subTaskIds: [...(parent.subTaskIds ?? []), id],
  };
  await store.saveTask(updatedParent);

  return task;
}

export async function getTaskTree(
  store: Store,
  rootTaskId: string,
): Promise<TaskTreeNode | null> {
  const root = await store.getTask(rootTaskId);
  if (!root) return null;
  return buildTaskTree(store, root, 0);
}

async function buildTaskTree(store: Store, task: Task, depth: number): Promise<TaskTreeNode> {
  const children: TaskTreeNode[] = [];
  for (const childId of task.subTaskIds ?? []) {
    const child = await store.getTask(childId);
    if (child) {
      children.push(await buildTaskTree(store, child, depth + 1));
    }
  }
  return { ...task, children, depth };
}

export function summarizeTaskProgress(tree: TaskTreeNode): string {
  const lines: string[] = [];
  function walk(node: TaskTreeNode, indent: string) {
    const progress = node.progress ?? 0;
    lines.push(`${indent}- [${node.status}] ${node.id}: ${node.input} (${progress}%)`);
    for (const child of node.children) {
      walk(child, indent + '  ');
    }
  }
  walk(tree, '');
  return lines.join('\n');
}

export async function getActiveTaskTree(
  store: Store,
  conversationId: string,
): Promise<TaskTreeNode | null> {
  const tasks = await store.listTasks(conversationId);
  const rootTask = tasks.find(t => !t.parentTaskId && t.status !== 'completed' && t.status !== 'failed');
  if (!rootTask) return null;
  return getTaskTree(store, rootTask.id);
}
