declare module "@/lib/api" {
  type Json = any;
  export const api: {
    nodes: {
      getAll: () => Promise<Json>;
      getById: (nodeId: string) => Promise<Json>;
      updateStatus: (nodeId: string, status: string) => Promise<Json>;
    };
    simulations: {
      getAll: () => Promise<Json>;
      getById: (id: string) => Promise<Json>;
      run: (data: Json) => Promise<Json>;
      getSummary: () => Promise<Json>;
      delete: (id: string) => Promise<Json>;
    };
    mitigation: {
      getAll: () => Promise<Json>;
      apply: (data: Json) => Promise<Json>;
      deactivate: (id: string) => Promise<Json>;
    };
  };
}
