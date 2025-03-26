"use client";
import PodsView from "@components/pods-view";
import PodsSettings from "@components/pods-settings";

export default function PodsModule() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Gestion des pods</h2>
      <PodsSettings />
      <PodsView />
    </div>
  );
}
