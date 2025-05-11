import React from "react";
import { Box, Button, Grid, GridItem, Icon } from "@chakra-ui/react";
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { ControlDirection } from "../../types/robot-control";

interface ControlPanelProps {
  onControl: (direction: ControlDirection) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onControl }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Grid templateColumns="repeat(3, 1fr)" gap={2}>
        <GridItem colStart={2}>
          <Button
            w="100%"
            h="60px"
            onClick={() => onControl("forward")}
            colorScheme="blue"
          >
            <Icon as={FaArrowUp} boxSize={6} />
          </Button>
        </GridItem>
        <GridItem>
          <Button
            w="100%"
            h="60px"
            onClick={() => onControl("left")}
            colorScheme="blue"
          >
            <Icon as={FaArrowLeft} boxSize={6} />
          </Button>
        </GridItem>
        <GridItem>
          <Button
            w="100%"
            h="60px"
            onClick={() => onControl("stop")}
            colorScheme="red"
          >
            STOP
          </Button>
        </GridItem>
        <GridItem>
          <Button
            w="100%"
            h="60px"
            onClick={() => onControl("right")}
            colorScheme="blue"
          >
            <Icon as={FaArrowRight} boxSize={6} />
          </Button>
        </GridItem>
        <GridItem colStart={2}>
          <Button
            w="100%"
            h="60px"
            onClick={() => onControl("backward")}
            colorScheme="blue"
          >
            <Icon as={FaArrowDown} boxSize={6} />
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
}; 