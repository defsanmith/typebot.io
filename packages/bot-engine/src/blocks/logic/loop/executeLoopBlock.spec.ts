import { LogicBlockType } from "@typebot.io/blocks-logic/constants";
import type { LoopBlock } from "@typebot.io/blocks-logic/loop/schema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { EventType } from "@typebot.io/events/constants";
import type { Variable } from "@typebot.io/variables/schemas";
import { LoopGuardrailError } from "./LoopGuardrailError";
import { MAX_ITERATIONS, executeLoopBlock } from "./executeLoopBlock";

const MOCK_BLOCK_ID_INSIDE_LOOP = "blockInLoop123";
const MOCK_BLOCK_ID_AFTER_LOOP = "blockAfterLoop456";
const MOCK_LOOP_BLOCK_ID = "loopBlock789";
const MOCK_VARIABLE_ID = "loopVariableId";

const createMockLoopBlock = (
  iterationsOption?: number, // Changed to iterationsOption to allow undefined for testing default
  loopIndexVariableId?: string,
): LoopBlock => ({
  id: MOCK_LOOP_BLOCK_ID,
  type: LogicBlockType.LOOP,
  items: [{ id: "item1", blockId: MOCK_BLOCK_ID_INSIDE_LOOP }],
  outgoingEdgeId: MOCK_BLOCK_ID_AFTER_LOOP,
  options: {
    // Conditionally add iterations if provided, otherwise options will be {} or just loopIndexVariableId
    ...(iterationsOption !== undefined && { iterations: iterationsOption }),
    ...(loopIndexVariableId && { loopIndexVariableId }),
  } as { iterations?: number; loopIndexVariableId?: string }, // Added cast to satisfy LoopBlock['options'] type
});

const createMockSessionState = (currentLoopIndex?: number): SessionState => ({
  version: "3",
  typebotsQueue: [
    {
      typebot: {
        id: "typebot1",
        version: "6",
        groups: [],
        events: [
          {
            id: "event1",
            type: EventType.START,
            graphCoordinates: { x: 0, y: 0 },
          },
        ],
        variables: [
          {
            id: MOCK_VARIABLE_ID,
            name: "Loop Index Var",
            value: null,
          },
        ],
        edges: [],
      },
      answers: [],
    },
  ],
  currentLoopIndex,
  currentBlockId: MOCK_LOOP_BLOCK_ID,
  workspaceId: "workspace1",
});

const mockVariables: Variable[] = [
  {
    id: MOCK_VARIABLE_ID,
    name: "Loop Index Var",
    value: null,
  },
];

describe("executeLoopBlock", () => {
  it("should loop 3 times and then exit, updating loopIndexVariable", () => {
    const iterations = 3;
    const loopBlock = createMockLoopBlock(iterations, MOCK_VARIABLE_ID);
    let currentSessionState = createMockSessionState();
    let currentVariables = [...mockVariables];
    const executionResults: string[] = [];

    // 1st iteration
    let result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      currentVariables,
      { resultId: "res1" } as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_INSIDE_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBe(1);
    expect(
      result.newVariables?.find((v) => v.id === MOCK_VARIABLE_ID)?.value,
    ).toBe("1");
    executionResults.push(result.outgoingEdgeId!);
    currentSessionState = result.newSessionState!;
    currentVariables = result.newVariables!;

    // 2nd iteration
    result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      currentVariables,
      { resultId: "res2" } as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_INSIDE_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBe(2);
    expect(
      result.newVariables?.find((v) => v.id === MOCK_VARIABLE_ID)?.value,
    ).toBe("2");
    executionResults.push(result.outgoingEdgeId!);
    currentSessionState = result.newSessionState!;
    currentVariables = result.newVariables!;

    // 3rd iteration
    result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      currentVariables,
      { resultId: "res3" } as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_INSIDE_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBe(3);
    expect(
      result.newVariables?.find((v) => v.id === MOCK_VARIABLE_ID)?.value,
    ).toBe("3");
    executionResults.push(result.outgoingEdgeId!);
    currentSessionState = result.newSessionState!;
    currentVariables = result.newVariables!;

    // After 3 iterations, should exit loop
    result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      currentVariables,
      { resultId: "res4" } as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_AFTER_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBeUndefined();
    // Check that variable was not updated again
    expect(result.newVariables).toBeUndefined();

    expect(executionResults).toEqual([
      MOCK_BLOCK_ID_INSIDE_LOOP,
      MOCK_BLOCK_ID_INSIDE_LOOP,
      MOCK_BLOCK_ID_INSIDE_LOOP,
    ]);
  });

  it("should throw LoopGuardrailError if iterations exceed MAX_ITERATIONS", () => {
    const loopBlock = createMockLoopBlock(MAX_ITERATIONS + 1);
    const sessionState = createMockSessionState();
    expect(() =>
      executeLoopBlock(loopBlock, sessionState, mockVariables, {} as any),
    ).toThrow(LoopGuardrailError);
  });

  it("should default to 1 iteration if iterations option is not provided", () => {
    // Call createMockLoopBlock without iterations argument to test default
    const loopBlock = createMockLoopBlock(undefined, undefined);

    let currentSessionState = createMockSessionState();

    // 1st iteration (and only, due to default)
    let result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      mockVariables,
      {} as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_INSIDE_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBe(1);
    currentSessionState = result.newSessionState!;

    // Next call should exit loop
    result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      mockVariables,
      {} as any,
    );
    expect(result.outgoingEdgeId).toBe(MOCK_BLOCK_ID_AFTER_LOOP);
    expect(result.newSessionState?.currentLoopIndex).toBeUndefined();
  });

  it("should not update variable if loopIndexVariableId is not provided", () => {
    const iterations = 1;
    const loopBlock = createMockLoopBlock(iterations); // No loopIndexVariableId
    const currentSessionState = createMockSessionState();
    const initialVariables = [
      { id: "anotherVar", name: "Another", value: "test" },
    ];
    const currentVariables = [...initialVariables];

    const result = executeLoopBlock(
      loopBlock,
      currentSessionState,
      currentVariables,
      { resultId: "res1" } as any,
    );
    expect(result.newSessionState?.currentLoopIndex).toBe(1);
    // Variables should not have changed as no loopIndexVariableId was specified
    expect(result.newVariables).toEqual(initialVariables);
    expect(result.setVariableHistory).toEqual([]); // No history should be generated
  });
});
