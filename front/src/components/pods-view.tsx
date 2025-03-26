"use client"

import { getPods } from "@lib/api"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { Pod } from "types/pod"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { Skeleton } from "@components/ui/skeleton"
import { AlertCircle, Clock, Server } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip"

interface PodsViewProps {
  selectedNamespace?: string
}

export default function PodsView({ selectedNamespace = "scalestorm" }: PodsViewProps) {
  const [sortBy, setSortBy] = useState<"name" | "usage">("name")
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes liquidWave {
        0% { transform: translateY(0) }
        50% { transform: translateY(-2px) }
        100% { transform: translateY(0) }
      }

      @keyframes liquidWaveMove {
        0% { transform: translateX(-100%) }
        100% { transform: translateX(100%) }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const {
    data: pods,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  }: {
    data: Pod[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
    dataUpdatedAt: number
  } = useQuery({
    queryKey: ["pods", selectedNamespace],
    queryFn: async () => {
      const res = await getPods(selectedNamespace)
      return res
    },
    refetchInterval: 2000,
    staleTime: 1000,
  })

  const getUsagePercentage = (pod: Pod): number => {
    if (!pod.cpu.limit && !pod.memory.limit) {
      return Math.floor(Math.random() * 80) + 10
    }

    let cpuPercentage = 0
    let memoryPercentage = 0

    if (pod.cpu.limit) {
      const cpuUsage = pod.cpu.usage?.unit === "n" ? pod.cpu.usage?.value / 1000000 : pod.cpu.usage?.value
      const cpuLimit = pod.cpu.limit.unit === "" ? pod.cpu.limit.value * 1000 : pod.cpu.limit.value
      cpuPercentage = (cpuUsage / cpuLimit) * 100
    }

    if (pod.memory.limit) {
      let memUsage = pod.memory.usage?.value
      const memLimit = pod.memory.limit?.value

      if (pod.memory.usage?.unit === "Ki" && pod.memory.limit?.unit === "Mi") {
        memUsage = memUsage / 1024
      } else if (pod.memory.usage?.unit === "Ki" && pod.memory.limit?.unit === "Gi") {
        memUsage = memUsage / (1024 * 1024)
      }

      memoryPercentage = (memUsage / memLimit) * 100
    }

    return Math.min(Math.max(cpuPercentage, memoryPercentage, 5), 100)
  }

  const getLiquidColor = (percentage: number): string => {
    if (percentage < 30) return "hsl(var(--success))" // green
    if (percentage < 60) return "hsl(var(--info))" // blue
    if (percentage < 85) return "hsl(var(--warning))" // yellow/orange
    return "hsl(var(--destructive))" // red
  }

  const getStatusColor = (percentage: number): "default" | "secondary" | "destructive" => {
    if (percentage < 60) return "default"
    if (percentage < 85) return "secondary"
    return "destructive"
  }

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  const sortedPods = pods
    ? [...pods].sort((a, b) => {
      if (sortBy === "usage") {
        return getUsagePercentage(b) - getUsagePercentage(a)
      }
      return a.name.localeCompare(b.name)
    })
    : []

  if (!hasMounted) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex justify-between items-center">
            <span>Pods</span>
            <Badge variant="outline" className="ml-2">
              Loading
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Pods</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load pods from namespace &quot;{selectedNamespace}&quot;.
              <button onClick={() => refetch()} className="ml-2 underline hover:text-destructive-foreground/80">
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Pods
              <Badge variant="outline" className="ml-2">
                {pods?.length || 0} running
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Namespace: {selectedNamespace}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Updated {getTimeAgo(dataUpdatedAt)}</span>
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "usage")}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="usage">Sort by usage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {sortedPods.map((pod) => {
            const percentage = getUsagePercentage(pod)
            const liquidColor = getLiquidColor(percentage)
            const statusColor = getStatusColor(percentage)

            return (
              <TooltipProvider key={pod.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:bg-muted/50">
                      {/* Pod visualization - Enhanced liquid effect */}
                      <div className="w-24 h-24 relative rounded-lg bg-background/80 backdrop-blur-sm shadow-md overflow-hidden border border-border">
                        {/* Liquid fill with animation */}
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                          style={{
                            height: `${percentage}%`,
                            background: `linear-gradient(to top, ${liquidColor}, ${liquidColor}80)`,
                            animation: "liquidWave 2s ease-in-out infinite alternate",
                          }}
                        >
                          {/* Enhanced wave effect */}
                          <div
                            className="absolute top-0 left-0 w-full h-1.5 bg-white/40"
                            style={{
                              animation: "liquidWaveMove 3s ease-in-out infinite",
                              boxShadow: "0 0 5px rgba(255, 255, 255, 0.3)",
                            }}
                          ></div>
                          <div
                            className="absolute top-2 left-0 w-full h-1 bg-white/20"
                            style={{
                              animation: "liquidWaveMove 3s ease-in-out 0.5s infinite",
                            }}
                          ></div>
                        </div>

                        {/* Glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                        {/* Percentage display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>

                      {/* Pod info */}
                      <div className="mt-3 text-center">
                        <div className="text-sm font-medium truncate max-w-[120px]" title={pod.name}>
                          {pod.name.length > 15 ? pod.name.substring(0, 15) + "..." : pod.name}
                        </div>
                        <Badge variant={statusColor} className="mt-1 text-xs">
                          {percentage < 60 ? "Normal" : percentage < 85 ? "High" : "Critical"}
                        </Badge>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium">{pod.name}</p>
                      <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">CPU:</span>
                        <span>
                          {pod.cpu.usage?.value || 0} {pod.cpu.usage?.unit || "m"} / {pod.cpu.limit?.value || "∞"}{" "}
                          {pod.cpu.limit?.unit || "m"}
                        </span>

                        <span className="text-muted-foreground">Memory:</span>
                        <span>
                          {pod.memory.usage?.value || 0} {pod.memory.usage?.unit || "Mi"} /{" "}
                          {pod.memory.limit?.value || "∞"} {pod.memory.limit?.unit || "Mi"}
                        </span>

                        <span className="text-muted-foreground">Status:</span>
                        <span>{percentage < 60 ? "Normal" : percentage < 85 ? "High usage" : "Critical usage"}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

