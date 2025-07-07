import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { WidgetProps } from './types';
import { Go2OusterPointCloudStore } from '../../../dashboard/store/data-channel-store/readonly/go2-ouster-pointcloud.store';
import { ParsedPointCloud2 } from '../../../dashboard/parser/go2-ouster-pointcloud';
import { WidgetFrame } from './WidgetFrame';

export interface Go2OusterPointCloudWidgetProps extends WidgetProps {
  store: Go2OusterPointCloudStore;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  intensity?: number;
}

export function Go2OusterPointCloudWidget({ robotId, store, dataType }: Go2OusterPointCloudWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [pointCloudData, setPointCloudData] = useState<ParsedPointCloud2 | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe((data: ParsedPointCloud2) => {
      setPointCloudData(data);
      setIsConnected(true);
      setError(null);
      setPointCount((data.width || 0) * (data.height || 0));
      setDimensions({ width: data.width || 0, height: data.height || 0 });
      setLastUpdate(new Date(data.timestamp));
    });

    return unsubscribe;
  }, [store]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정 함수
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // 실제 캔버스 크기 (픽셀)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // CSS 크기
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // 컨텍스트 스케일 조정
      ctx.scale(dpr, dpr);
      
      return { width: rect.width, height: rect.height };
    };

    // 초기 크기 설정
    const { width: canvasWidth, height: canvasHeight } = setCanvasSize();

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    // 애니메이션 함수
    const animate = () => {
      // 캔버스 초기화
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (pointCloudData && pointCloudData.data) {
        try {
          // PointCloud2 데이터에서 포인트 추출
          const points: Point3D[] = [];
          const data = pointCloudData.data;
          const pointStep = pointCloudData.pointStep || 32; // 기본값
          const width = pointCloudData.width || 0;
          const height = pointCloudData.height || 0;

          if (width > 0 && height > 0) {
            for (let i = 0; i < data.length; i += pointStep) {
              if (i + 16 <= data.length) { // 최소 16바이트 (x, y, z, intensity)
                const x = new Float32Array(data.slice(i, i + 4).buffer)[0];
                const y = new Float32Array(data.slice(i + 4, i + 8).buffer)[0];
                const z = new Float32Array(data.slice(i + 8, i + 12).buffer)[0];
                const intensity = new Float32Array(data.slice(i + 16, i + 20).buffer)[0];
                
                points.push({ x, y, z, intensity });
              }
            }
          }

          if (points.length > 0) {
            // 좌표 범위 계산
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            
            points.forEach((point: Point3D) => {
              minX = Math.min(minX, point.x);
              maxX = Math.max(maxX, point.x);
              minY = Math.min(minY, point.y);
              maxY = Math.max(maxY, point.y);
              minZ = Math.min(minZ, point.z);
              maxZ = Math.max(maxZ, point.z);
            });

            const rangeX = maxX - minX;
            const rangeY = maxY - minY;
            const rangeZ = maxZ - minZ;

            if (rangeX > 0 && rangeY > 0 && rangeZ > 0) {
              // 스케일 팩터 계산 (캔버스에 맞게)
              const scaleX = canvasWidth / rangeX;
              const scaleY = canvasHeight / rangeY;
              const scale = Math.min(scaleX, scaleY) * 0.8; // 80%로 스케일링

              // 중앙점 계산
              const centerX = canvasWidth / 2;
              const centerY = canvasHeight / 2;
              const centerDataX = (minX + maxX) / 2;
              const centerDataY = (minY + maxY) / 2;

              // 포인트 그리기
              ctx.globalAlpha = 0.6;

              points.forEach((point: Point3D) => {
                const x = centerX + (point.x - centerDataX) * scale;
                const y = centerY + (point.y - centerDataY) * scale;
                
                // Z값에 따른 색상 변화
                const zRatio = (point.z - minZ) / rangeZ;
                const intensity = Math.floor(255 * (1 - zRatio));
                ctx.fillStyle = `rgb(${intensity}, ${intensity}, 255)`;
                
                // 포인트 크기 (Z값에 따라)
                const pointSize = Math.max(1, 3 * (1 - zRatio));
                
                ctx.beginPath();
                ctx.arc(x, y, pointSize, 0, Math.PI * 2);
                ctx.fill();
              });

              ctx.globalAlpha = 1.0;

              // 좌표축 그리기
              ctx.strokeStyle = '#e53e3e';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(centerX + 50, centerY);
              ctx.stroke();

              ctx.strokeStyle = '#38a169';
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(centerX, centerY - 50);
              ctx.stroke();

              // 범례 그리기
              ctx.fillStyle = '#2d3748';
              ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillText('X', centerX + 55, centerY + 5);
              ctx.fillText('Y', centerX - 5, centerY - 55);
            }
          }
        } catch (error) {
          console.error('PointCloud2 데이터 처리 중 오류:', error);
          setError('PointCloud2 데이터 처리 중 오류가 발생했습니다.');
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [pointCloudData]);

  // Footer info
  const footerInfo = [
    {
      label: 'Points',
      value: pointCount.toLocaleString()
    },
    {
      label: 'Dimensions',
      value: `${dimensions.width} × ${dimensions.height}`
    },
    {
      label: 'Data Type',
      value: (dataType || 'unknown').toUpperCase()
    },
    ...(lastUpdate ? [
      {
        label: 'Last Update',
        value: lastUpdate.toLocaleTimeString()
      }
    ] : [])
  ];

  return (
    <WidgetFrame
      title="Go2 Ouster PointCloud"
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={isConnected ? 'PointCloud data active' : 'Waiting for data...'}
    >
      {error ? (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          h="100%" 
          color="red.500"
          textAlign="center"
        >
          <Box fontSize="2xl" mb={2}>⚠️</Box>
          <Box fontSize="sm">{error}</Box>
        </Flex>
      ) : (
        <Box
          width="100%"
          height="100%"
          position="relative"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bg="black"
          borderRadius="md"
        >
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
        </Box>
      )}
    </WidgetFrame>
  );
} 