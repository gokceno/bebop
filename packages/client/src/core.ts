import type {
  BebopConfig,
  BebopClient,
  BebopFactory,
  BebopSendArgs,
} from "./types";

// Simple queue implementation that works in both browser and Node.js
export class SimpleQueue {
  public queue: Array<() => Promise<void>> = [];
  public running = 0;
  private concurrency: number;

  constructor(options: { concurrency: number }) {
    this.concurrency = options.concurrency;
  }

  async add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;
    
    try {
      await task();
    } finally {
      this.running--;
      this.process();
    }
  }

  async onIdle(): Promise<void> {
    // Wait for all pending tasks to complete
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}



// Universal HTTP client using fetch
export class UniversalHttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private output: boolean;

  constructor(baseUrl: string, bearerToken: string | undefined, jwt: string | undefined, output: boolean = false) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${bearerToken || jwt}`,
      'Content-Type': 'application/json',
    };
    this.output = output;
  }

  async post(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (this.output) console.log(result);
      return result;
    } catch (e: any) {
      if (this.output) console.error(e.message);
      throw e;
    }
  }
}

// Core Bebop implementation that works in both environments
export const createBebopClient: BebopFactory = ({
  concurrency = 1,
  baseUrl,
  bearerToken,
  jwt,
  output = false,
}: BebopConfig = {}): BebopClient => {
  if (!baseUrl || !baseUrl.startsWith("https://"))
    throw new Error("Missing https URL.");
  if (!bearerToken && !jwt)
    throw new Error(
      "Missing authentication header; either JWT or bearer token should be present."
    );
  
  const queue = new SimpleQueue({ concurrency });
  const httpClient = new UniversalHttpClient(baseUrl, bearerToken, jwt, output);
  
  const sendSingleEvent = async (eventName: string, eventParams?: object, eventTrace?: object[]) => {
    if (eventTrace && !Array.isArray(eventTrace)) {
      if (output) console.error("Event trace must be an object array.");
    }
    
    return queue.add(async () => {
      await httpClient.post('/collect', {
        $event: eventName,
        $params: eventParams || {},
        $trace: eventTrace || [],
      });
    });
  };



  return {
    send: async (...args: BebopSendArgs): Promise<void> => {
      const [eventName, eventParams, eventTrace] = args;
      await sendSingleEvent(eventName, eventParams, eventTrace);
    },
    
    sendAsync: (...args: BebopSendArgs): void => {
      const [eventName, eventParams, eventTrace] = args;
      
      // Fire and forget single event
      sendSingleEvent(eventName, eventParams, eventTrace).catch((e) => {
        if (output) console.error('Bebop sendAsync error:', e.message);
      });
    },
    
    flush: async (): Promise<void> => {
      // Wait for all pending tasks to complete
      await queue.onIdle();
    },
  };
};