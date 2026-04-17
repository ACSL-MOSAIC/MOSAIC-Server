import type { ReactNode } from "react";

import { Box } from "@chakra-ui/react";

export interface WidgetBodyProps {
  children: ReactNode;
}

export function WidgetBody({ children }: WidgetBodyProps) {
  return (
    <Box
      border="0.5px solid"
      borderColor="gray.100"
      borderRadius="lg"
      bg="white"
      boxShadow="xs"
      flex="1"
      minH="250px"
      position="relative"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
}
