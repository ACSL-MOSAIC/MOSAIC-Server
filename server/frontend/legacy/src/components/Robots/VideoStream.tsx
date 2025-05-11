import React from "react";
import { Box, Text, VStack } from "@chakra-ui/react";

interface VideoStreamProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  fps: number;
}

export const VideoStream: React.FC<VideoStreamProps> = ({ videoRef, fps }) => {
  return (
    <VStack spacing={4} align="stretch">
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        position="relative"
        width="100%"
        height="400px"
        bg="gray.100"
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          autoPlay
          playsInline
        />
      </Box>
      <Text textAlign="center" fontSize="sm" color="gray.500">
        FPS: {fps}
      </Text>
    </VStack>
  );
}; 