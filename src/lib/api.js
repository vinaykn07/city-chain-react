const BASE_URL = "https://urban-sim-backend-production.up.railway.app/api";

export const api = {
  // NODES
  nodes: {
    getAll: () => fetch(`${BASE_URL}/nodes`).then(r => r.json()),
    getById: (nodeId) => fetch(`${BASE_URL}/nodes/${nodeId}`).then(r => r.json()),
    updateStatus: (nodeId, status) => fetch(`${BASE_URL}/nodes/${nodeId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    }).then(r => r.json()),
  },

  // SIMULATIONS
  simulations: {
    getAll: () => fetch(`${BASE_URL}/simulations`).then(r => r.json()),
    getById: (id) => fetch(`${BASE_URL}/simulations/${id}`).then(r => r.json()),
    run: (data) => fetch(`${BASE_URL}/simulations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    getSummary: () => fetch(`${BASE_URL}/simulations/metrics/summary`).then(r => r.json()),
    delete: (id) => fetch(`${BASE_URL}/simulations/${id}`, {
      method: "DELETE"
    }).then(r => r.json()),
  },

  // MITIGATION
  mitigation: {
    getAll: () => fetch(`${BASE_URL}/mitigation`).then(r => r.json()),
    apply: (data) => fetch(`${BASE_URL}/mitigation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    deactivate: (id) => fetch(`${BASE_URL}/mitigation/${id}/deactivate`, {
      method: "PATCH"
    }).then(r => r.json()),
  }
};
