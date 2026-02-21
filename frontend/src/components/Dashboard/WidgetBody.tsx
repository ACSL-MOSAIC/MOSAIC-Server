import { Box } from "@chakra-ui/react"
import type { ReactNode } from "react"

export interface WidgetBodyProps {
  children: ReactNode
}

// function NoDataWidget() {
//   return (
//     <Box
//       display="flex"
//       flexDirection="column"
//       alignItems="center"
//       justifyContent="center"
//       height="100%"
//       bg="gray.50"
//       borderRadius="md"
//       p={4}
//     >
//       <Badge colorScheme="gray" mb={2}>
//         Not Connected
//       </Badge>
//       <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
//         Reconnect or connect to a robot is required.
//       </Text>
//     </Box>
//   )
// }

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
    >
      {children}
    </Box>
  )
}
