export interface AutoscaleConfig {
  enabled: boolean;
  manualReplicas?: number;
  minReplicas?: number;
  maxReplicas?: number;
  metrics?: {
    cpu?: {
      enabled: boolean;
      target: number;
    };
    memory?: {
      enabled: boolean;
      target: number;
    };
  };
}
