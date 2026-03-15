import { Box, Flex } from "@chakra-ui/react";

type AngleIndicatorProps = { height?: string; fontSize?: string; fontColor?: string };

export default function AngleIndicator({
  height = "24px",
  fontSize = "10px",
  fontColor = "gray.400",
}: AngleIndicatorProps) {
  const angles = [
    { label: "-180°", position: "0%" },
    { label: "-90°", position: "25%" },
    { label: "0°", position: "50%" },
    { label: "90°", position: "75%" },
    { label: "180°", position: "100%" },
  ];

  return (
    <Box position="relative" width="100%" height={height} px={2}>
      {/* Base line */}
      <Box
        position="absolute"
        top="50%"
        left="0"
        right="0"
        height="1px"
        bg={fontColor}
        opacity={0.3}
      />

      {/* Tick marks and labels */}
      {angles.map(({ label, position }) => (
        <Flex
          key={label}
          position="absolute"
          top="0"
          left={position}
          transform="translateX(-50%)"
          direction="column"
          alignItems="center"
          height="100%"
        >
          {/* Tick mark */}
          <Box width="1px" height="6px" bg={fontColor} opacity={0.5} />
          {/* Label */}
          <Box fontSize={fontSize} color={fontColor} mt="2px" fontFamily="mono">
            {label}
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
