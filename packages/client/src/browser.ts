import { createBebopClient } from "./core";
import type {
  BebopConfig,
  BebopClient,
  BebopFactory,
  BebopSendArgs,
} from "./types";

export const Bebop: BebopFactory = createBebopClient;

export type { BebopConfig, BebopClient, BebopFactory, BebopSendArgs };