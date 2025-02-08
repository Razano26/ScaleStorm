"use client";
import { useState } from "react";
import { Slider } from "@components/ui/slider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { setLoad, getLoad } from "@lib/api";
import { useWebSocket } from "@hooks/useWebSocket";


export default function RequestsModule() {

  const responseTime = useWebSocket();

  const [requestsPerSecond, setRequestsPerSecond] = useState(50);

  // Récupérer la valeur actuelle depuis l'API
  const { data } = useQuery({ queryKey: ["load"], queryFn: getLoad });

  // Mettre à jour la charge
  const mutation = useMutation({
    mutationFn: (value: number) => setLoad(value),
  });

  const handleSliderChange = (value: number[]) => {
    setRequestsPerSecond(value[0]);
    console.log("Nouvelle charge définie :", value[0]); // ✅ DEBUG LOG
    mutation.mutate(value[0]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Requêtes par seconde</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <label htmlFor="rps-slider" className="block text-sm font-medium text-gray-600 mb-2">
          Nombre de requêtes par seconde : {data || requestsPerSecond}
        </label>
        <p className="text-gray-500 text-sm">Temps de réponse : {responseTime}ms</p>
        <Slider
          id="rps-slider"
          min={1}
          max={100}
          step={1}
          value={[requestsPerSecond]}
          onValueChange={handleSliderChange}
          className="mb-6"
        />
      </div>
    </div>
  );
}
