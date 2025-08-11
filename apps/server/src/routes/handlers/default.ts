import { db, schema } from "../../utils/db";
import type {
  ICollectHandler,
  JWTPayload,
  ParamsInput,
  Config,
} from "../../types";

export class Default implements ICollectHandler {
  public handlerName = "default";
  public target = ["*"];
  public satisfies = ["jwt", "bearer"];
  public handle = async (
    event: string,
    params: ParamsInput,
    trace: object,
    jwtPayload: JWTPayload | undefined,
    config: Config
  ) => {
    const eventData = await db.transaction(async (tx) => {
      // Create the event record
      const [newEvent] = await tx
        .insert(schema.events)
        .values({
          eventName: event,
        })
        .returning();

      // Insert claims
      if (config.auth.jwt.claims && jwtPayload) {
        const claims = config.auth.jwt.claims.filter(
          (c) => jwtPayload[c] !== undefined
        );
        if (claims.length) {
          await tx.insert(schema.eventsClaims).values(
            claims.map((claimName) => ({
              eventId: newEvent.id,
              claimName,
              claimValue: jwtPayload[claimName] || null,
            }))
          );
        }
      }

      // Insert all parameters
      if (params) {
        const paramsEntries = Object.entries(params);
        if (paramsEntries.length > 0) {
          await tx.insert(schema.eventsParams).values(
            paramsEntries.map(([paramName, paramValue]) => ({
              eventId: newEvent.id,
              paramName,
              paramValue: paramValue?.toString() || null,
            }))
          );
        }
      }

      // Insert trace data - each trace item as separate record
      if (trace && Array.isArray(trace) && trace.length > 0) {
        await tx.insert(schema.eventsTraces).values(
          trace.map((traceData: unknown) => ({
            eventId: newEvent.id,
            traceData: traceData as object,
          }))
        );
      }
      return { [this.handlerName]: newEvent.id };
    });
    return eventData;
  };
}
