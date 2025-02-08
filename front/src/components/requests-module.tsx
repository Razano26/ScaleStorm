"use client";
import { useState } from "react"
import { Slider } from "@components/ui/slider"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "@components/ui/chart"

export default function RequestsModule() {
  const [requestsPerSecond, setRequestsPerSecond] = useState(50)
  const [responseTimeData, setResponseTimeData] = useState(generateMockData(50))

  const handleSliderChange = (value: number[]) => {
    setRequestsPerSecond(value[0])
    setResponseTimeData(generateMockData(value[0]))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Requêtes par seconde</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <label htmlFor="rps-slider" className="block text-sm font-medium text-gray-600 mb-2">
          Nombre de requêtes par seconde : {requestsPerSecond}
        </label>
        <Slider
          id="rps-slider"
          min={1}
          max={100}
          step={1}
          value={[requestsPerSecond]}
          onValueChange={handleSliderChange}
          className="mb-6"
        />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={responseTimeData}>
              <XAxis dataKey="time" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip />
              <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function generateMockData(requestsPerSecond: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    time: i,
    responseTime: Math.round((Math.random() * 100) / requestsPerSecond),
  }))
}

