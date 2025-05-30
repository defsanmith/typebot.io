import { Tag, Text } from "@chakra-ui/react";
import type { LoopBlock } from "@typebot.io/blocks-logic/loop/schema";
import React from "react";

type Props = {
  options: LoopBlock["options"];
};

export const LoopNodeBody = ({ options }: Props) => {
  const iterations = options?.iterations;

  if (!iterations) {
    return <Text color="gray.500">Configure iterations...</Text>;
  }

  return (
    <Text>
      Repeat <Tag colorScheme="purple">{iterations}</Tag> time(s)
    </Text>
  );
};
