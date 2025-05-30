import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { LogicBlockType } from "../constants";

export const loopBlockOptionsSchema = z.object({
  iterations: z.number().int().min(1).max(100).optional(), // Made iterations optional
  loopIndexVariableId: z.string().optional(),
});

// Redefined loopItemSchema to include blockId, as expected by executeLoopBlock.ts
const loopItemSchema = z.object({
  id: z.string(), // Standard item ID
  blockId: z.string(), // ID of the first block in the loop sub-flow
});

export const loopBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([LogicBlockType.LOOP]),
      options: loopBlockOptionsSchema.optional(), // made options itself optional
      items: z.array(loopItemSchema).optional(), // Sub-flow starting block
    }),
  )
  .openapi({
    title: "Loop",
    ref: "loopLogic",
  });

export type LoopBlock = z.infer<typeof loopBlockSchema>;
