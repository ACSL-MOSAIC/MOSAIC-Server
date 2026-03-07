import type { ReactNode } from "react";

import { Box } from "@chakra-ui/react";

export interface WidgetBodyProps {
  children: ReactNode;
}

export function WidgetBody({ children }: WidgetBodyProps) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p="3"
      bg="white"
      boxShadow="sm"
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
