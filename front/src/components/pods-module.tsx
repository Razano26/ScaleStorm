"use client";
import { useState, useEffect } from "react";
import { Slider } from "@components/ui/slider";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { setReplicas, getReplicas, toggleAutoscale } from "@lib/api";

export default function PodsModule() {
  const [autoScale, setAutoScale] = useState(false);
  const { data: replicas, refetch } = useQuery({ queryKey: ["replicas"], queryFn: getReplicas });

  const replicaMutation = useMutation({
    mutationFn: (value: number) => setReplicas(value),
    onSuccess: () => refetch(),
  });

  const autoscaleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleAutoscale(enabled),
  });

  const handleSliderChange = (value: number[]) => {
    replicaMutation.mutate(value[0]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Gestion des pods</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="auto-scale"
            checked={autoScale}
            onCheckedChange={(checked) => {
              setAutoScale(checked === true);
              autoscaleMutation.mutate(checked === true);
            }}
          />
          <Label htmlFor="auto-scale" className="text-sm font-medium text-gray-600">
            Auto-scaling
          </Label>
        </div>
        <div className="mb-6">
          {!autoScale && (
            <>
              <label htmlFor="replica-slider" className="block text-sm font-medium text-gray-600 mb-2">
                Nombre de réplicas : {replicas || 3}
              </label>
              <Slider
                id="replica-slider"
                min={1}
                max={10}
                step={1}
                value={[replicas || 3]}
                onValueChange={handleSliderChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
