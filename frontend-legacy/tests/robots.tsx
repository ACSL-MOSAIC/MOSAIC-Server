import { createFileRoute } from "@tanstack/react-router"
import React from "react"
import { RobotControl } from "../src/components/Robots/RobotControl"

interface Robot {
  id: string
  name: string
}

export const Route = createFileRoute("/robots")({
  component: RobotsPage,
})

function RobotsPage() {
  const robots: Robot[] = [] // 임시 데이터

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">로봇 제어 시스템</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {robots.map((robot) => (
          <div key={robot.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">{robot.name}</h2>
            <RobotControl userId="user1" robotId={robot.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
