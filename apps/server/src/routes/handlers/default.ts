import { db, schema } from "../../utils/db";
import type { ICollectHandler, JWTPayload, ParamsInput } from "../../types";

export class Default implements ICollectHandler {
  public handlerName = "default";
  public target = ["*"];
  public satisfies = ["jwt", "bearer"];
  public handle = async (
    event: string,
    params: ParamsInput,
    trace: object,
    jwtPayload: JWTPayload | undefined
  ) => {
    const eventData = await db.transaction(async (tx) => {
      // Create the event record
      const [newEvent] = await tx
        .insert(schema.events)
        .values({
          eventName: event,
          originator: jwtPayload || {},
        })
        .returning();

      // Insert all parameters
      if (params) {
        const paramsEntries = Object.entries(params);
        if (paramsEntries.length > 0) {
          await tx.insert(schema.eventsParams).values(
            paramsEntries.map(([paramName, paramValue]) => ({
              eventId: newEvent.id,
              paramName,
              paramValue: paramValue?.toString() || "",
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
