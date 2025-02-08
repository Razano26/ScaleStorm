"use client"

import { useState, useEffect } from "react"
import { Slider } from "@components/ui/slider"
import { Checkbox } from "@components/ui/checkbox"
import { Label } from "@components/ui/label"
import { Skeleton } from "@components/ui/skeleton"

export default function PodsModule() {
  const [autoScale, setAutoScale] = useState(false)
  const [replicaCount, setReplicaCount] = useState(3)
  const [autoscaledPods, setAutoscaledPods] = useState(3)

  useEffect(() => {
    if (autoScale) {
      // Simuler l'auto-scaling en changeant le nombre de pods toutes les 3 secondes
      const interval = setInterval(() => {
        setAutoscaledPods(Math.floor(Math.random() * 10) + 1)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [autoScale])

  const handleSliderChange = (value: number[]) => {
    setReplicaCount(value[0])
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Gestion des pods</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox id="auto-scale" checked={autoScale} onCheckedChange={(checked) => setAutoScale(checked === true)} />
          <Label htmlFor="auto-scale" className="text-sm font-medium text-gray-600">
            Auto-scaling
          </Label>
        </div>
        <div className="mb-6">
          {autoScale ? (
            <Skeleton className="h-6 w-full" />
          ) : (
            <>
              <label htmlFor="replica-slider" className="block text-sm font-medium text-gray-600 mb-2">
                Nombre de réplicas : {replicaCount}
              </label>
              <Slider
                id="replica-slider"
                min={1}
                max={10}
                step={1}
                value={[replicaCount]}
                onValueChange={handleSliderChange}
              />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: autoScale ? autoscaledPods : replicaCount }).map((_, index) => (
            <PodBox key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PodBox() {
  const usage = Math.random() * 100
  return (
    <div className="aspect-square relative overflow-hidden bg-gray-100 rounded-md shadow-sm">
      <div
        className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-500"
        style={{ height: `${usage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800">
        {Math.round(usage)}%
      </div>
    </div>
  )
}

