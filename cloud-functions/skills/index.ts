/**
 * GET/POST /skills
 *
 * GET:  list all skills
 * POST: { action: 'get' | 'save' | 'delete', ... } manage skills
 */

import { listSkills, getSkill, saveSkill, deleteSkill } from '../../shared/skills';
import type { SkillDefinition } from '../../shared/types';

export async function onRequest(context: any) {
  const request = context.request;
  const method = request.method ?? 'GET';

  try {
    if (method === 'GET') {
      return jsonResponse({ skills: listSkills() });
    }

    const body = request.body ?? {};
    const action = body.action ?? 'get';

    if (action === 'get') {
      const skill = getSkill(body.id);
      return jsonResponse({ skill: skill ?? null });
    }

    if (action === 'save') {
      const skill = body.skill as SkillDefinition;
      if (!skill?.id || !skill.name) {
        return jsonResponse({ error: 'skill.id and skill.name are required' }, 400);
      }
      saveSkill(skill);
      return jsonResponse({ skill: getSkill(skill.id) });
    }

    if (action === 'delete') {
      deleteSkill(body.id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
