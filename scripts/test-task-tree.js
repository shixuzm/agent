import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { MemoryStore } = await jiti.import('../shared/store.ts');
const { createSubTask, getTaskTree, summarizeTaskProgress, getActiveTaskTree } = await jiti.import(
  '../shared/context/tasks.ts',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  const store = new MemoryStore();
  const conversationId = 'conv_test_tree';
  const otherConversationId = 'conv_other';

  // 创建根任务
  const rootTask = {
    id: 'T1',
    conversationId,
    agentId: 'agent_super',
    status: 'running',
    progress: 10,
    input: '根任务：实现树状任务系统',
    createdAt: Date.now(),
  };
  await store.saveTask(rootTask);
  console.log('✓ 创建根任务', rootTask.id);

  // 创建子任务 T1.1、T1.2
  const child1 = await createSubTask(store, 'T1', {
    conversationId,
    agentId: 'agent_coder',
    status: 'pending',
    progress: 0,
    input: '实现 createSubTask',
  });
  assert(child1.id === 'T1.1', `Expected child id T1.1, got ${child1.id}`);
  assert(child1.parentTaskId === 'T1', 'T1.1 parent should be T1');
  console.log('✓ 创建子任务', child1.id);

  const child2 = await createSubTask(store, 'T1', {
    conversationId,
    agentId: 'agent_writer',
    status: 'pending',
    progress: 0,
    input: '实现 summarizeTaskProgress',
  });
  assert(child2.id === 'T1.2', `Expected child id T1.2, got ${child2.id}`);
  assert(child2.parentTaskId === 'T1', 'T1.2 parent should be T1');
  console.log('✓ 创建子任务', child2.id);

  // 再为 T1.1 创建子任务 T1.1.1
  const grandChild = await createSubTask(store, 'T1.1', {
    conversationId,
    agentId: 'agent_coder',
    status: 'pending',
    progress: 0,
    input: '子任务的子任务',
  });
  assert(grandChild.id === 'T1.1.1', `Expected grandchild id T1.1.1, got ${grandChild.id}`);
  console.log('✓ 创建孙任务', grandChild.id);

  // 验证父任务 subTaskIds 已更新
  const parent = await store.getTask('T1');
  assert(
    parent.subTaskIds.length === 2 && parent.subTaskIds.includes('T1.1') && parent.subTaskIds.includes('T1.2'),
    'T1 subTaskIds should contain T1.1 and T1.2',
  );
  console.log('✓ 父任务 subTaskIds 已更新', parent.subTaskIds);

  // 获取任务树
  const tree = await getTaskTree(store, 'T1');
  assert(tree !== null, 'Task tree should not be null');
  assert(tree.id === 'T1', 'Tree root should be T1');
  assert(tree.depth === 0, 'Tree root depth should be 0');
  assert(tree.children.length === 2, 'T1 should have 2 children');
  assert(tree.children[0].id === 'T1.1', 'First child should be T1.1');
  assert(tree.children[0].depth === 1, 'T1.1 depth should be 1');
  assert(tree.children[0].children.length === 1, 'T1.1 should have 1 child');
  assert(tree.children[0].children[0].id === 'T1.1.1', 'T1.1 child should be T1.1.1');
  assert(tree.children[0].children[0].depth === 2, 'T1.1.1 depth should be 2');
  console.log('✓ 任务树结构正确');

  // 汇总任务进展
  const summary = summarizeTaskProgress(tree);
  assert(summary.includes('- [running] T1:'), 'Summary should include T1');
  assert(summary.includes('- [pending] T1.1:'), 'Summary should include T1.1');
  assert(summary.includes('- [pending] T1.1.1:'), 'Summary should include T1.1.1');
  assert(summary.includes('- [pending] T1.2:'), 'Summary should include T1.2');
  console.log('✓ 任务进展汇总输出:');
  console.log(summary);

  // 测试按 conversationId 过滤
  await store.saveTask({
    id: 'T2',
    conversationId: otherConversationId,
    agentId: 'agent_super',
    status: 'running',
    input: '其他会话任务',
    createdAt: Date.now(),
  });

  const filtered = await store.listTasks(conversationId);
  assert(filtered.length === 4, `Expected 4 tasks for conversation, got ${filtered.length}`);
  assert(filtered.every(t => t.conversationId === conversationId), 'All filtered tasks should belong to conversationId');
  console.log('✓ listTasks 按 conversationId 过滤正确');

  const allTasks = await store.listTasks();
  assert(allTasks.length === 5, `Expected 5 total tasks, got ${allTasks.length}`);
  console.log('✓ listTasks 不传参数返回全部任务');

  // 测试 getActiveTaskTree 返回当前会话的活跃根任务
  const activeTree = await getActiveTaskTree(store, conversationId);
  assert(activeTree !== null, 'Active task tree should not be null');
  assert(activeTree.id === 'T1', 'Active root should be T1');
  console.log('✓ getActiveTaskTree 正确返回活跃根任务树');

  // 测试 getActiveTaskTree 返回其他会话的活跃根任务
  const otherActiveTree = await getActiveTaskTree(store, otherConversationId);
  assert(otherActiveTree !== null, 'Other active task tree should not be null');
  assert(otherActiveTree.id === 'T2', 'Other active root should be T2');
  console.log('✓ getActiveTaskTree 按 conversationId 隔离正确');

  // 测试无活跃根任务时返回 null
  const emptyConversationId = 'conv_empty';
  await store.saveTask({
    id: 'T3',
    conversationId: emptyConversationId,
    agentId: 'agent_super',
    status: 'completed',
    input: '已完成的会话任务',
    createdAt: Date.now(),
  });
  const emptyTree = await getActiveTaskTree(store, emptyConversationId);
  assert(emptyTree === null, 'Should return null when no active root task');
  console.log('✓ getActiveTaskTree 在无活跃任务时返回 null');

  console.log('\n所有树状任务系统测试通过。');
}

runTests().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
