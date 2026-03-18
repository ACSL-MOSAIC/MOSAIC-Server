import { Box, Code, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import { LuTriangleAlert } from "react-icons/lu";

export interface ErrorWidgetProps {
  error: string;
}

export function ErrorWidget({ error }: ErrorWidgetProps) {
  return (
    <Flex h="100%" align="center" justify="center">
      <Box w="100%" h="100%" bgGradient="linear(to-b, red.50, white)" p={4}>
        <VStack align="start" gap={4} h="100%">
          <HStack gap={2}>
            <Flex
              w="7"
              h="7"
              align="center"
              justify="center"
              borderRadius="full"
              bg="red.100"
              color="red.700"
            >
              <Icon as={LuTriangleAlert} boxSize={4} />
            </Flex>
            <VStack align="start" gap={0}>
              <Text fontSize="sm" fontWeight="semibold" color="red.800">
                Widget Error
              </Text>
              <Text fontSize="xs" color="gray.600">
                This widget could not be loaded due to an error.
              </Text>
            </VStack>
          </HStack>
          <Box
            w="100%"
            p={3}
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            bg="white"
          >
            <Text fontSize="xs" color="gray.500" mb={1}>
              Error
            </Text>
            <Code fontSize="xs" color="red.700">
              {error}
            </Code>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}