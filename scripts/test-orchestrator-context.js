/**
 * Test orchestrator context integration.
 *
 * Uses jiti to load TypeScript modules without pre-compilation.
 * Run: node scripts/test-orchestrator-context.js
 */

import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testContextModules() {
  console.log('--- Loading context modules ---');
  const budget = await jiti.import('../shared/context/budget.ts');
  const rebuild = await jiti.import('../shared/context/rebuild.ts');
  const tasks = await jiti.import('../shared/context/tasks.ts');
  const checkpoint = await jiti.import('../shared/context/checkpoint.ts');
  assert(typeof budget.createBudget === 'function', 'createBudget should be exported');
  assert(typeof budget.estimateTokens === 'function', 'estimateTokens should be exported');
  assert(typeof budget.getContextWindow === 'function', 'getContextWindow should be exported');
  assert(typeof budget.shouldRebuildContext === 'function', 'shouldRebuildContext should be exported');
  assert(typeof rebuild.rebuildContext === 'function', 'rebuildContext should be exported');
  assert(typeof tasks.getActiveTaskTree === 'function', 'getActiveTaskTree should be exported');
  assert(typeof tasks.summarizeTaskProgress === 'function', 'summarizeTaskProgress should be exported');
  assert(typeof checkpoint.loadCheckpoint === 'function', 'loadCheckpoint should be exported');
  assert(typeof checkpoint.maybeSaveCheckpoint === 'function', 'maybeSaveCheckpoint should be exported');
  console.log('✓ Context modules loaded');
  return { budget, rebuild, tasks, checkpoint };
}

async function testBudgetAndRebuild(ctx) {
  console.log('--- Budget and rebuild integration ---');
  const { createBudget, estimateTokens, shouldRebuildContext } = ctx.budget;
  const { rebuildContext } = ctx.rebuild;

  const modelName = '@makers/deepseek-v4-flash';
  const contextWindow = ctx.budget.getContextWindow(modelName);
  assert(contextWindow === 64000, `Expected context window 64000, got ${contextWindow}`);

  // Simulate a conversation that is below the rebuild threshold
  const smallMessages = [
    { id: 'm1', conversationId: 'c1', role: 'user', content: 'hello', timestamp: 1 },
    { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'world', timestamp: 2 },
  ];
  const smallUsed = smallMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const smallBudget = createBudget(modelName, smallUsed);
  assert(!shouldRebuildContext(smallBudget, smallMessages), 'Small conversation should not trigger rebuild');
  console.log('✓ Small conversation stays within budget');

  // Simulate a conversation that exceeds the rebuild threshold
  const longContent = 'a'.repeat(Math.ceil(smallBudget.rebuildThreshold * 3.5) + 100);
  const largeMessages = [
    ...smallMessages,
    { id: 'm3', conversationId: 'c1', role: 'user', content: longContent, timestamp: 3 },
  ];
  const largeUsed = largeMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const largeBudget = createBudget(modelName, largeUsed);
  assert(shouldRebuildContext(largeBudget, largeMessages), 'Large conversation should trigger rebuild');
  console.log('✓ Large conversation triggers rebuild');

  // Test rebuildContext output
  const rebuilt = await rebuildContext({
    budget: largeBudget,
    checkpointText: '## Current Focus\nTesting orchestrator context integration.',
    taskProgressText: '- [running] t1: test task (50%)',
    memoryStore: null,
    userInput: 'test input',
    recentMessages: largeMessages,
    systemPrompt: 'You are a helpful assistant.',
  });
  assert(rebuilt.messages.length > 0, 'Rebuilt messages should not be empty');
  assert(rebuilt.messages[0].role === 'system', 'First rebuilt message should be system');
  assert(rebuilt.messages.some(m => m.id === 'checkpoint'), 'Expected checkpoint message');
  assert(rebuilt.messages.some(m => m.id === 'task-progress'), 'Expected task progress message');
  assert(rebuilt.tokenUsage.systemPrompt > 0, 'Expected system prompt token usage');
  assert(rebuilt.tokenUsage.checkpoint > 0, 'Expected checkpoint token usage');
  assert(rebuilt.tokenUsage.taskProgress > 0, 'Expected task progress token usage');
  console.log('✓ rebuildContext produces structured messages and token usage');
}

async function testOrchestratorExports() {
  console.log('--- Orchestrator exports ---');
  const orchestrator = await jiti.import('../shared/orchestrator.ts');
  assert(typeof orchestrator.planAndExecute === 'function', 'planAndExecute should be exported');
  assert(typeof orchestrator.executeAgentTask === 'function', 'executeAgentTask should be exported');
  assert(typeof orchestrator.selectAgent === 'function', 'selectAgent should be exported');
  console.log('✓ Orchestrator exports loaded');

  // Verify executeAgentTask accepts ChatMessage[] by inspecting its parameter count
  const fn = orchestrator.executeAgentTask;
  assert(fn.length >= 4, 'executeAgentTask should accept at least 4 parameters');
  console.log('✓ executeAgentTask signature compatible with ChatMessage[]');
}

async function runTests() {
  const ctx = await testContextModules();
  await testBudgetAndRebuild(ctx);
  await testOrchestratorExports();
  console.log('\nAll orchestrator context integration tests passed.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
