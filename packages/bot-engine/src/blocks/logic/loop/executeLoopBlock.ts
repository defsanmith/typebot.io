import { createId } from "@paralleldrive/cuid2";
import type { BlockBase } from "@typebot.io/blocks-base/schemas";
import type { LoopBlock } from "@typebot.io/blocks-logic/loop/schema";
import type { RuntimeOptions } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type {
  SetVariableHistoryItem,
  Variable,
} from "@typebot.io/variables/schemas";
import { LoopGuardrailError } from "./LoopGuardrailError";

export const MAX_ITERATIONS = 100;

// Type for Variables array
type Variables = Variable[];

export const executeLoopBlock = (
  block: LoopBlock,
  sessionState: SessionState,
  variables: Variables,
  runtimeOptions?: RuntimeOptions,
): {
  outgoingEdgeId: string | undefined;
  newVariables?: Variables;
  newSessionState?: SessionState;
  setVariableHistory?: SetVariableHistoryItem[];
} => {
  const iterations = block.options?.iterations ?? 1; // Default to 1 iteration if not specified
  if (iterations > MAX_ITERATIONS) {
    throw new LoopGuardrailError(
      `Loop iterations (\${iterations}) exceed maximum of \${MAX_ITERATIONS}`,
    );
  }

  let loopIndex = sessionState.currentLoopIndex ?? 0;
  const newSetVariableHistory: SetVariableHistoryItem[] = [];

  if (loopIndex < iterations) {
    loopIndex++;
    const newSessionState: SessionState = {
      ...sessionState,
      currentLoopIndex: loopIndex,
    };
    let newVariables: Variables = variables;
    if (block.options?.loopIndexVariableId) {
      const variable = variables.find(
        (v: Variable) => v.id === block.options?.loopIndexVariableId,
      );
      if (variable) {
        newVariables = variables.map((v: Variable) =>
          v.id === block.options?.loopIndexVariableId
            ? { ...v, value: loopIndex.toString() }
            : v,
        );
        newSetVariableHistory.push({
          resultId: (runtimeOptions as any)?.resultId ?? createId(),
          index: 0, // Placeholder, this might need to be incremented or managed properly
          blockId: (block as BlockBase).id,
          variableId: block.options.loopIndexVariableId,
          value: loopIndex.toString(),
        });
      }
    }
    // The first item in the block's items array is the start of the sub-flow
    const outgoingEdgeId = block.items?.[0]?.blockId;
    return {
      outgoingEdgeId,
      newVariables,
      newSessionState,
      setVariableHistory: newSetVariableHistory,
    };
  } else {
    // Loop finished, reset loopIndex and proceed to the next block
    const newSessionState: SessionState = {
      ...sessionState,
      currentLoopIndex: undefined, // Reset loop index
    };
    return {
      outgoingEdgeId: block.outgoingEdgeId,
      newSessionState,
    };
  }
};
