import assert from "node:assert/strict";
import test from "node:test";

import { runCampervanSimulation } from "../scripts/run-line-campervan-multiturn.mjs";

test("simulates ten independent campervan customers with ten consecutive questions each", async () => {
  const simulation = await runCampervanSimulation();
  assert.equal(simulation.personaResults.length, 10);
  assert.equal(simulation.totalQuestions, 100);
  assert.equal(simulation.expectedQuestionCount, 100);
  assert.ok(simulation.knowledgeEntryCount >= 55);

  const failures = simulation.personaResults.flatMap((persona) =>
    persona.turns
      .filter((turn) => !turn.passed)
      .map((turn) => ({
        persona: persona.id,
        turn: turn.number,
        question: turn.question.text,
        reply: turn.result.reply,
        checks: turn.checks
      }))
  );
  assert.deepEqual(failures, []);

  for (const persona of simulation.personaResults) {
    assert.equal(persona.turns.length, 10, persona.id);
    assert.equal(persona.finalState.service, "campervan", persona.id);
    assert.ok(persona.finalState.history.length <= 20, persona.id);
  }
});
