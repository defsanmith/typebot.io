import { NumberInput } from "@/components/inputs/NumberInput";
import { VariableSearchInput } from "@/components/inputs/VariableSearchInput";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { FormLabel, Stack, Text } from "@chakra-ui/react";
import type { LoopBlock } from "@typebot.io/blocks-logic/loop/schema";
import React from "react";

type Props = {
  options: LoopBlock["options"];
  onOptionsChange: (options: LoopBlock["options"]) => void;
};

export const LoopSettings = ({ options, onOptionsChange }: Props) => {
  const { typebot } = useTypebot();

  const handleIterationsChange = (iterations?: number | `{{${string}}}`) => {
    onOptionsChange({ ...options, iterations: iterations as any });
  };

  const handleVariableChange = (variable?: { id: string; name: string }) => {
    onOptionsChange({ ...options, loopIndexVariableId: variable?.id });
  };

  return (
    <Stack spacing={4}>
      <Stack>
        <FormLabel mb="0">Number of iterations:</FormLabel>
        <NumberInput
          defaultValue={options?.iterations}
          onValueChange={handleIterationsChange}
          min={1}
          max={100} // Corresponds to MAX_ITERATIONS
          placeholder="Number of times to repeat"
        />
      </Stack>
      <Stack>
        <FormLabel mb="0">Store current iteration in (optional):</FormLabel>
        <Text fontSize="sm" color="gray.500" mt="0">
          The loop index (1-based) will be saved in this variable.
        </Text>
        <VariableSearchInput
          initialVariableId={options?.loopIndexVariableId}
          onSelectVariable={handleVariableChange}
          placeholder="Select a variable"
        />
      </Stack>
    </Stack>
  );
};
