import { DateTime } from "luxon";

export const timestamp = (createdAt: Date | string) => {
  let dateTime: DateTime;

  if (typeof createdAt === "string") {
    dateTime = DateTime.fromISO(createdAt);
  } else {
    dateTime = DateTime.fromJSDate(createdAt);
  }

  if (!dateTime.isValid) {
    console.warn("Invalid DateTime:", createdAt, dateTime.invalidReason);
    return String(createdAt);
  }

  const today = DateTime.now().startOf("day");
  const entryDate = dateTime.startOf("day");

  if (entryDate.equals(today)) {
    return dateTime.toFormat("HH:mm:ss");
  } else {
    return dateTime.toFormat("yyyy-MM-dd HH:mm:ss");
  }
};
