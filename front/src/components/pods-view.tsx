"use client"

import { getPods } from "@lib/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Pod } from "../types/pod";

export default function PodsView() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: pods, isLoading, error }: { data: Pod[]; isLoading: boolean; error: Error | null } = useQuery({
    queryKey: ["pods"],
    queryFn: async () => {
      const res = await getPods();
      return res;
    },
    refetchInterval: 2000,
    staleTime: 1000,
  });

  const getUsagePercentage = (pod: Pod): number => {
    if (!pod.cpu.limit && !pod.memory.limit) {
      return Math.floor(Math.random() * 80) + 10;
    }

    let cpuPercentage = 0;
    let memoryPercentage = 0;

    if (pod.cpu.limit) {
      const cpuUsage = pod.cpu.usage.unit === "n" ? pod.cpu.usage.value / 1000000 : pod.cpu.usage.value;
      const cpuLimit = pod.cpu.limit.unit === "" ? pod.cpu.limit.value * 1000 : pod.cpu.limit.value;
      cpuPercentage = (cpuUsage / cpuLimit) * 100;
    }

    if (pod.memory.limit) {
      let memUsage = pod.memory.usage.value;
      const memLimit = pod.memory.limit.value;

      if (pod.memory.usage.unit === "Ki" && pod.memory.limit.unit === "Mi") {
        memUsage = memUsage / 1024;
      } else if (pod.memory.usage.unit === "Ki" && pod.memory.limit.unit === "Gi") {
        memUsage = memUsage / (1024 * 1024);
      }

      memoryPercentage = (memUsage / memLimit) * 100;
    }

    return Math.min(Math.max(cpuPercentage, memoryPercentage, 5), 100);
  };

  const getLiquidColor = (percentage: number): string => {
    if (percentage < 30) return "#4ade80"; // green
    if (percentage < 60) return "#2dd4bf"; // turquoise
    if (percentage < 85) return "#fb923c"; // orange
    return "#f87171"; // red
  };

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-xl font-semibold mb-6">Pods</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8 p-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-md mx-auto"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-xl font-semibold mb-6">Pods</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading pods. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Pods</h2>
        <div className="text-sm text-gray-500">
          {pods?.length || 0} pods running
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {pods && pods.map((pod) => {
          const percentage = getUsagePercentage(pod);
          const liquidColor = getLiquidColor(percentage);

          return (
            <div
              key={pod.name}
              className="group flex flex-col items-center p-6 rounded-xl transition-all duration-200 w-full"
            >
              {/* Modern cube with glass effect */}
              <div className="w-24 h-24 relative rounded-lg bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden border border-gray-200/50">
                {/* Liquid with gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: `${percentage}%`,
                    background: `linear-gradient(to top, ${liquidColor}, ${liquidColor}80)`,
                  }}
                >
                  {/* Wave effect */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/40"></div>
                </div>

                {/* Percentage with glow effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-800 drop-shadow-sm">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>

              {/* Pod name with tooltip */}
              <div className="mt-3 text-center">
                <div
                  className="text-sm text-gray-600 truncate max-w-[120px] group-hover:text-gray-900 transition-colors"
                  title={pod.name.replace("-", " ")}
                >
                  {pod.name.length > 15 ? pod.name.substring(0, 15) + "..." : pod.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
