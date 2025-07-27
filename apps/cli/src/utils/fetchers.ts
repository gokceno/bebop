import type { EventType, Parameter } from "../types";
import * as emoji from "node-emoji";

export const fetchDependents = async () => {
  let eventTypes: EventType[] = [];
  let parameters: Parameter[] = [];

  try {
    const response = await fetch("http://localhost:3000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer bebop-api-key-1",
      },
      body: JSON.stringify({
        query: `
        query {
          eventTypes {
            label
            type
          }
          parameters {
            name
            label
            type
            eventTypes
          }
        }
      `,
      }),
    });

    const result = await response.json();
    if (result.data?.eventTypes) {
      eventTypes = result.data.eventTypes as EventType[];
    }
    if (result.data?.parameters) {
      parameters = result.data.parameters as Parameter[];
    }
  } catch (error) {
    console.warn(
      emoji.get(":skull:"),
      "Could not fetch event types and parameters, using raw names:",
      error
    );
  }

  return { eventTypes, parameters };
};
