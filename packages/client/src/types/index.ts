export interface BebopConfig {
  concurrency?: number;
  baseUrl?: string;
  bearerToken?: string;
  jwt?: string;
  output?: boolean;
  batching?: {
    enabled?: boolean;
    maxBatchSize?: number;
    flushInterval?: number;
  };
}

export interface BebopClient {
  send: (...args: BebopSendArgs) => Promise<void>;
  sendAsync: (...args: BebopSendArgs) => void;
  flush: () => Promise<void>;
  batch: (events: Array<{ eventName: string; eventParams?: object; eventTrace?: object[] }>) => void;
}

export type BebopFactory = (config?: BebopConfig) => BebopClient;

export type BebopSendArgs = [
  eventName: string,
  eventParams?: object,
  eventTrace?: object[]
];
