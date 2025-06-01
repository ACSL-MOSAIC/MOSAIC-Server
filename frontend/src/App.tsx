import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { WebSocketProvider } from "./contexts/WebSocketContext"

const queryClient = new QueryClient()

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <RouterProvider router={router} />
      </WebSocketProvider>
    </QueryClientProvider>
  )
}

export default App 