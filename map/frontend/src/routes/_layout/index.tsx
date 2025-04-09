import { Box, Container, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import useAuth from "../../hooks/useAuth"

// Leaflet의 기본 마커 아이콘 설정을 위한 코드
// Leaflet의 기본 마커 이미지 경로 문제를 해결
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null)
  const [locationError, setLocationError] = useState<string>("")

  useEffect(() => {
    // 위치 정보를 가져오는 함수
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          setLocationError('Unable to retrieve your location')
          console.error('Error getting location:', error)
        }
      )
    }

    getLocation()
  }, [])

  return (
    <>
      <Container maxW="full">
        <Box pt={12} m={4}>
          <Text fontSize="2xl">
            Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
          </Text>
          <Text>Welcome back, nice to see you</Text>
          
          {location ? (
            <>
              <Text mt={2} mb={4}>
                Your location: {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
              </Text>
              <Box height="400px" borderRadius="lg" overflow="hidden">
                <MapContainer 
                  center={[location.latitude, location.longitude]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[location.latitude, location.longitude]}>
                    <Popup>
                      You are here!<br/>
                      {currentUser?.full_name || currentUser?.email}
                    </Popup>
                  </Marker>
                </MapContainer>
              </Box>
            </>
          ) : (
            <Text mt={2} color="red.500">
              {locationError || "Getting location..."}
            </Text>
          )}
        </Box>
      </Container>
    </>
  )
}
