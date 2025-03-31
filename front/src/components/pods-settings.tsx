"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Checkbox } from "@components/ui/checkbox"
import { Label } from "@components/ui/label"
import { Slider } from "@components/ui/slider"
import { Input } from "@components/ui/input"
import { Badge } from "@components/ui/badge"
import { Separator } from "@components/ui/separator"
import { InfoIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getAutoscale } from "../lib/api"
import { AutoscaleConfig } from "../types/autoscale"

export default function PodsSettings() {
  const { data: autoscaleConfig, isLoading } = useQuery<AutoscaleConfig>({
    queryKey: ["autoscale"],
    queryFn: getAutoscale,
  })

  const [autoScale, setAutoScale] = useState(false)
  const [minReplicas, setMinReplicas] = useState(4)
  const [maxReplicas, setMaxReplicas] = useState(10)
  const [cpuTarget, setCpuTarget] = useState(50)
  const [memoryTarget, setMemoryTarget] = useState(50)
  const [manualReplicas, setManualReplicas] = useState(4)
  const [cpuEnabled, setCpuEnabled] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(false)

  useEffect(() => {
    if (autoscaleConfig) {
      setAutoScale(autoscaleConfig.enabled)
      setMinReplicas(autoscaleConfig.minReplicas ?? 4)
      setMaxReplicas(autoscaleConfig.maxReplicas ?? 10)
      setManualReplicas(autoscaleConfig.manualReplicas ?? 4)

      // Handle metrics
      if (autoscaleConfig.metrics) {
        if (autoscaleConfig.metrics.cpu) {
          setCpuEnabled(autoscaleConfig.metrics.cpu.enabled)
          setCpuTarget(autoscaleConfig.metrics.cpu.target)
        }
        if (autoscaleConfig.metrics.memory) {
          setMemoryEnabled(autoscaleConfig.metrics.memory.enabled)
          setMemoryTarget(autoscaleConfig.metrics.memory.target)
        }
      }
    }
  }, [autoscaleConfig])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Pods Configuration</CardTitle>
              <CardDescription className="mt-1">Configure scaling settings for your application pods</CardDescription>
            </div>
            <Badge variant={autoScale ? "default" : "outline"} className="h-6">
              {autoScale ? "Auto Scaling" : "Manual Scaling"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-6">
            <Checkbox
              id="auto-scale"
              checked={autoScale}
              onCheckedChange={(checked) => {
                setAutoScale(checked === true)
                // autoscaleMutation.mutate(checked === true);
              }}
            />
            <Label htmlFor="auto-scale" className="font-medium cursor-pointer">
              Enable autoscaling
            </Label>
            <div className="text-muted-foreground text-sm flex items-center ml-2">
              <InfoIcon className="h-4 w-4 mr-1" />
              <span>Automatically adjust resources based on workload</span>
            </div>
          </div>

          {autoScale ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Replica Configuration</h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="min-replicas" className="text-sm">
                          Minimum Replicas
                        </Label>
                        <span className="text-sm font-medium">{minReplicas}</span>
                      </div>
                      <Slider
                        id="min-replicas"
                        min={1}
                        max={10}
                        step={1}
                        value={[minReplicas]}
                        onValueChange={(value) => {
                          setMinReplicas(value[0])
                          if (value[0] > maxReplicas) {
                            setMaxReplicas(value[0])
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="max-replicas" className="text-sm">
                          Maximum Replicas
                        </Label>
                        <span className="text-sm font-medium">{maxReplicas}</span>
                      </div>
                      <Slider
                        id="max-replicas"
                        min={minReplicas}
                        max={30}
                        step={1}
                        value={[maxReplicas]}
                        onValueChange={(value) => setMaxReplicas(value[0])}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Target Metrics</h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cpu-enabled"
                          checked={cpuEnabled}
                          onCheckedChange={(checked) => setCpuEnabled(checked === true)}
                        />
                        <Label htmlFor="cpu-enabled" className="text-sm">
                          Enable CPU Scaling
                        </Label>
                      </div>
                      {cpuEnabled && (
                        <div className="space-y-2 pl-6">
                          <div className="flex justify-between">
                            <Label htmlFor="cpu-target" className="text-sm">
                              CPU Utilization Target
                            </Label>
                            <span className="text-sm font-medium">{cpuTarget}%</span>
                          </div>
                          <Slider
                            id="cpu-target"
                            min={1}
                            max={100}
                            step={1}
                            value={[cpuTarget]}
                            onValueChange={(value) => setCpuTarget(value[0])}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="memory-enabled"
                          checked={memoryEnabled}
                          onCheckedChange={(checked) => setMemoryEnabled(checked === true)}
                        />
                        <Label htmlFor="memory-enabled" className="text-sm">
                          Enable Memory Scaling
                        </Label>
                      </div>
                      {memoryEnabled && (
                        <div className="space-y-2 pl-6">
                          <div className="flex justify-between">
                            <Label htmlFor="memory-target" className="text-sm">
                              Memory Utilization Target
                            </Label>
                            <span className="text-sm font-medium">{memoryTarget}%</span>
                          </div>
                          <Slider
                            id="memory-target"
                            min={1}
                            max={100}
                            step={1}
                            value={[memoryTarget]}
                            onValueChange={(value) => setMemoryTarget(value[0])}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                Your pods will scale between {minReplicas} and {maxReplicas} replicas based on{" "}
                {cpuEnabled && `${cpuTarget}% CPU`}
                {cpuEnabled && memoryEnabled && " and "}
                {memoryEnabled && `${memoryTarget}% memory`}
                {" utilization targets."}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Manual Scaling</h3>

              <div className="flex items-center space-x-4 max-w-xs">
                <Label htmlFor="manual-replicas" className="min-w-24 text-sm">
                  Number of Replicas
                </Label>
                <Input
                  type="number"
                  id="manual-replicas"
                  min={1}
                  max={30}
                  value={manualReplicas}
                  onChange={(e) => setManualReplicas(Number.parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                Your application will run with exactly {manualReplicas} replica{manualReplicas !== 1 ? "s" : ""} at all
                times.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

