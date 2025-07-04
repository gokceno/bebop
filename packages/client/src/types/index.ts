export interface BebopConfig {
  concurrency?: number;
  baseUrl?: string;
  bearerToken?: string;
  jwt?: string;
  output?: boolean;
}

export interface BebopClient {
  send: (...args: BebopSendArgs) => Promise<void>;
  sendAsync: (...args: BebopSendArgs) => void;
  flush: () => Promise<void>;
}

export type BebopFactory = (config?: BebopConfig) => BebopClient;

export type BebopSendArgs = [
  eventName: string,
  eventParams?: object,
  eventTrace?: object[]
];
