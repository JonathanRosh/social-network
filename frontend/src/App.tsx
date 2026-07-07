import { useEffect, useState } from "react";

type HealthStatus = "checking" | "ok" | "error";

function App() {
  const [backendStatus, setBackendStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(() => setBackendStatus("ok"))
      .catch(() => setBackendStatus("error"));
  }, []);

  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Real-Time Social Network</h1>
        <p className="text-gray-500">Scaffolding phase — backend status: {backendStatus}</p>
      </div>
    </div>
  );
}

export default App;
