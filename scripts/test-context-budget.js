import {
  createBudget,
  estimateTokens,
  getContextWindow,
  shouldSaveCheckpoint,
  shouldRebuildContext,
  truncateToBudget,
} from '../shared/context/budget.js';
import { rebuildContext } from '../shared/context/rebuild.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testBudget() {
  console.log('--- Budget tests ---');

  const budget = createBudget('gpt-4o', 1000);
  assert(budget.total === 128000, `Expected total 128000, got ${budget.total}`);
  assert(budget.checkpoint === 19200, `Expected checkpoint 19200, got ${budget.checkpoint}`);
  assert(budget.taskProgress === 12800, `Expected taskProgress 12800, got ${budget.taskProgress}`);
  assert(budget.memory === 12800, `Expected memory 12800, got ${budget.memory}`);
  assert(budget.recentMessages === 57600, `Expected recentMessages 57600, got ${budget.recentMessages}`);
  assert(budget.systemPrompt === 12800, `Expected systemPrompt 12800, got ${budget.systemPrompt}`);
  assert(budget.reserve === 12800, `Expected reserve 12800, got ${budget.reserve}`);
  assert(budget.checkpointThreshold === 70400, `Expected checkpointThreshold 70400, got ${budget.checkpointThreshold}`);
  assert(budget.rebuildThreshold === 102400, `Expected rebuildThreshold 102400, got ${budget.rebuildThreshold}`);
  assert(budget.used === 1000, `Expected used 1000, got ${budget.used}`);
  console.log('✓ createBudget for gpt-4o');

  assert(getContextWindow('@makers/deepseek-v4-flash') === 64000, 'deepseek-v4-flash window mismatch');
  assert(getContextWindow('unknown-model') === 32000, 'unknown model should fallback to default');
  assert(getContextWindow() === 32000, 'undefined model should fallback to default');
  console.log('✓ getContextWindow');

  assert(estimateTokens('hello world') === Math.ceil(11 / 3.5), `estimateTokens mismatch: ${estimateTokens('hello world')}`);
  console.log('✓ estimateTokens');

  const customBudget = createBudget('default', 0, {
    checkpointRatio: 0.2,
    recentMessagesRatio: 0.5,
    checkpointThreshold: 0.6,
  });
  assert(customBudget.checkpoint === 6400, `custom checkpoint mismatch: ${customBudget.checkpoint}`);
  assert(customBudget.recentMessages === 16000, `custom recentMessages mismatch: ${customBudget.recentMessages}`);
  assert(customBudget.checkpointThreshold === 19200, `custom threshold mismatch: ${customBudget.checkpointThreshold}`);
  console.log('✓ createBudget custom options');
}

async function testThresholds() {
  console.log('--- Threshold tests ---');

  const budget = createBudget('default', 0);
  const longText = 'a'.repeat(Math.ceil(budget.checkpointThreshold * 3.5) + 10);
  const shortText = 'a'.repeat(10);

  assert(shouldSaveCheckpoint(budget, [{ content: longText }]), 'should trigger checkpoint save');
  assert(!shouldSaveCheckpoint(budget, [{ content: shortText }]), 'should not trigger checkpoint save');
  console.log('✓ shouldSaveCheckpoint');

  const rebuildText = 'a'.repeat(Math.ceil(budget.rebuildThreshold * 3.5) + 10);
  assert(shouldRebuildContext(budget, [{ content: rebuildText }]), 'should trigger rebuild');
  assert(!shouldRebuildContext(budget, [{ content: shortText }]), 'should not trigger rebuild');
  console.log('✓ shouldRebuildContext');
}

async function testTruncateToBudget() {
  console.log('--- truncateToBudget tests ---');

  const items = [
    { text: 'a'.repeat(7), cost: 2 }, // 7 chars ~ 2 tokens
    { text: 'b'.repeat(14), cost: 4 },
    { text: 'c'.repeat(21), cost: 6 },
    { text: 'd'.repeat(28), cost: 8 },
  ];

  const kept = truncateToBudget(items, 10, i => i.cost);
  assert(kept.length === 2, `Expected 2 items, got ${kept.length}`);
  assert(kept[0].text.startsWith('a'), 'first kept item mismatch');
  console.log('✓ truncateToBudget keep first');

  const keptLast = truncateToBudget(items, 10, i => i.cost, { keepLast: true });
  assert(keptLast.length === 1, `Expected 1 last item, got ${keptLast.length}`);
  assert(keptLast[keptLast.length - 1].text.startsWith('d'), 'last kept item mismatch');
  console.log('✓ truncateToBudget keep last');
}

async function testRebuildContext() {
  console.log('--- Rebuild context tests ---');

  const budget = createBudget('default', 0);
  const recentMessages = [
    { id: 'm1', conversationId: 'c1', role: 'user', content: 'hello', timestamp: 1 },
    { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'world', timestamp: 2 },
    { id: 'm3', conversationId: 'c1', role: 'user', content: 'how are you?', timestamp: 3 },
  ];

  const result = await rebuildContext({
    budget,
    checkpointText: 'checkpoint summary',
    taskProgressText: 'task progress summary',
    memoryStore: null,
    userInput: 'test',
    recentMessages,
    systemPrompt: 'You are a helpful assistant.',
  });

  assert(result.messages.length > 0, 'expected at least system message');
  assert(result.messages[0].id === 'system-prompt', 'first message should be system prompt');
  assert(result.messages.some(m => m.id === 'checkpoint'), 'expected checkpoint message');
  assert(result.messages.some(m => m.id === 'task-progress'), 'expected task progress message');
  assert(result.messages.some(m => m.id === 'm3'), 'expected recent message m3');
  assert(result.tokenUsage.systemPrompt > 0, 'expected system prompt token usage');
  assert(result.tokenUsage.checkpoint > 0, 'expected checkpoint token usage');
  assert(result.tokenUsage.taskProgress > 0, 'expected task progress token usage');
  console.log('✓ rebuildContext basic');
}

async function testRebuildWithMemory() {
  console.log('--- Rebuild with memory tests ---');

  const mockMemoryStore = {
    isEnabled: () => true,
    searchMemories: () => [
      {
        memory: {
          id: 'mem-1',
          type: 'project',
          scope: 'global',
          title: 'Project Alpha',
          content: 'Build a reusable SQLite memory module with full-text search',
          createdAt: 1,
          updatedAt: 2,
        },
        rank: 1,
      },
    ],
  };

  const budget = createBudget('default', 0);
  const result = await rebuildContext({
    budget,
    checkpointText: null,
    taskProgressText: null,
    memoryStore: mockMemoryStore,
    userInput: 'SQLite full text',
    recentMessages: [],
    systemPrompt: 'You are a helpful assistant.',
  });

  assert(result.messages.some(m => m.id.startsWith('memory-')), 'expected memory message');
  assert(result.tokenUsage.memory > 0, 'expected memory token usage');
  console.log('✓ rebuildContext with memory search');
}

async function runTests() {
  await testBudget();
  await testThresholds();
  await testTruncateToBudget();
  await testRebuildContext();
  await testRebuildWithMemory();
  console.log('\nAll context budget tests passed.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
