import RequestsModule from "@components/requests-module"
import PodsModule from "@components/pods-module"

export default function Home() {
  return (
    <main className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Tableau de bord</h1>
      <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
        <div className="flex-1">
          <RequestsModule />
        </div>
        <div className="w-px bg-gray-200 hidden md:block" />
        <div className="flex-1">
          <PodsModule />
        </div>
      </div>
    </main>
  )
}

