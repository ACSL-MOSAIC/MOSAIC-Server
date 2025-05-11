import React, { useEffect, useRef, useState } from "react";
import { Container, Grid, GridItem, Heading } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ControlPanel } from "../../components/Robots/ControlPanel";
import { VideoStream } from "../../components/Robots/VideoStream";
import { PositionDisplay } from "../../components/Robots/PositionDisplay";
import { RobotControlClient } from "../../client/websocket/RobotControlClient";
import { ControlDirection, PositionData } from "../../types/robot-control";

interface RobotControlParams {
  robotId: string;
}

export const Route = createFileRoute('/_layout/robot-control')({
  component: RobotControl,
  validateSearch: (search) => ({}),
  beforeLoad: ({ params }) => ({
    robotId: params.robotId,
  }),
});

function RobotControl() {
  const { robotId } = Route.useParams();
  const navigate = useNavigate();
  const [fps, setFps] = useState(0);
  const [position, setPosition] = useState<PositionData | null>(null);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<RobotControlClient | null>(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // FPS 계산을 위한 인터벌 설정
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    // WebSocket 클라이언트 초기화
    clientRef.current = new RobotControlClient(
      "user_1", // TODO: 실제 사용자 ID로 변경
      robotId,
      (pos) => setPosition(pos),
      (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      (state) => {
        setConnectionState(state);
        if (state === "disconnected") {
          navigate({ to: "/robots" });
        }
      }
    );

    // 비디오 프레임 카운트 설정
    if (videoRef.current) {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const countFrames = () => {
          frameCountRef.current++;
          videoRef.current?.requestVideoFrameCallback(countFrames);
        };
        videoRef.current.requestVideoFrameCallback(countFrames);
      } else {
        videoRef.current.addEventListener('timeupdate', () => {
          frameCountRef.current++;
        });
      }
    }

    return () => {
      // 정리
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
      }
      clientRef.current?.disconnect();
    };
  }, [robotId, navigate]);

  const handleControl = (direction: ControlDirection) => {
    clientRef.current?.sendControlCommand(direction);
  };

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>Robot Control</Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mt={6}>
        <GridItem>
          <ControlPanel onControl={handleControl} />
        </GridItem>
        <GridItem>
          <PositionDisplay position={position} />
        </GridItem>
        <GridItem>
          <VideoStream videoRef={videoRef} fps={fps} />
        </GridItem>
      </Grid>
    </Container>
  );
} 