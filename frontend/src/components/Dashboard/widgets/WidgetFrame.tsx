import React from 'react'
import { Box, Text, VStack, HStack, Badge, Flex } from '@chakra-ui/react'

export interface WidgetFrameProps {
  title: string
  isConnected: boolean
  children: React.ReactNode
  footerInfo?: Array<{
    label: string
    value: string | React.ReactNode
  }>
  footerMessage?: string
  minHeight?: string
  padding?: string
}

export function WidgetFrame({ 
  title, 
  isConnected, 
  children, 
  footerInfo = [], 
  footerMessage,
  minHeight = "250px",
  padding = "3"
}: WidgetFrameProps) {
  return (
    <VStack gap={3} align="stretch" h="100%">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="bold" color={isConnected ? 'green.500' : 'gray.500'}>
          {title}
        </Text>
        <Badge colorScheme={isConnected ? 'green' : 'gray'} variant="subtle">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </Flex>
      
      {/* Main Container */}
      <Box 
        border="1px solid" 
        borderColor="gray.200" 
        borderRadius="lg" 
        p={padding}
        bg="white"
        boxShadow="sm"
        flex="1"
        minH={minHeight}
        position="relative"
        overflow="hidden"
      >
        {children}
      </Box>
      
      {/* Footer Info */}
      {footerInfo.length > 0 && (
        <VStack gap={2} align="stretch">
          {footerInfo.map((info, index) => (
            <HStack key={index} justify="space-between" fontSize="xs">
              <Text color="gray.600" fontWeight="medium">{info.label}</Text>
              <Text color="gray.800" fontFamily="mono">
                {info.value}
              </Text>
            </HStack>
          ))}
          
          {footerMessage && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {footerMessage}
            </Text>
          )}
        </VStack>
      )}
    </VStack>
  )
}

// Loading state component
export function WidgetLoadingState({ title }: { title: string }) {
  return (
    <WidgetFrame title={title} isConnected={false}>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        h="100%" 
        color="gray.500"
      >
        <Text>Loading...</Text>
      </Flex>
    </WidgetFrame>
  )
}

// Error state component
export function WidgetErrorState({ title, error }: { title: string; error: string }) {
  return (
    <WidgetFrame title={title} isConnected={false}>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        h="100%" 
        color="red.500"
        textAlign="center"
      >
        <Text fontSize="2xl" mb={2}>⚠️</Text>
        <Text fontSize="sm">{error}</Text>
      </Flex>
    </WidgetFrame>
  )
}

// No data state component
export function WidgetNoDataState({ title, message }: { title: string; message?: string }) {
  return (
    <WidgetFrame title={title} isConnected={false}>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        h="100%" 
        color="gray.500"
        textAlign="center"
      >
        <Text fontSize="sm">{message || 'No data available'}</Text>
      </Flex>
    </WidgetFrame>
  )
} 