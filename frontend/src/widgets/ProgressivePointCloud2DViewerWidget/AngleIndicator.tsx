import { Box } from "@chakra-ui/react";

type AngleIndicatorProps = { height: string; fontSize: string; fontColor: string };

export default function AngleIndicator({ height, fontSize, fontColor }: AngleIndicatorProps) {
  return (
    <Box
      position="relative"
      width="100%"
      height={height}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={2}
      mb={1}
    >
      <Box fontSize={fontSize} color={fontColor} position="absolute" left="2">
        -180°
      </Box>
      <Box fontSize={fontSize} color={fontColor} position="absolute" left="25%">
        -90°
      </Box>
      <Box
        fontSize={fontSize}
        color={fontColor}
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
      >
        0°
      </Box>
      <Box fontSize={fontSize} color={fontColor} position="absolute" right="25%">
        90°
      </Box>
      <Box fontSize={fontSize} color={fontColor} position="absolute" right="2">
        180°
      </Box>
    </Box>
  );
}
