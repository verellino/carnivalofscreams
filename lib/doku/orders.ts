import type { NightId, TablePackageId } from "../tables";

export function newOrderId(packageId: string, nightId: string) {
  const night = nightId === "oct-31" ? "31" : "30";
  const pack = packageId.slice(0, 3).toUpperCase();
  const rand = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `COS-${night}-${pack}-${rand}`;
}

export function parseOrderId(orderId: string) {
  const match = /^COS-(30|31)-([A-Z]{3})-/.exec(orderId);
  if (!match) return undefined;

  const nightId: NightId = match[1] === "31" ? "oct-31" : "oct-30";
  const packCode = match[2];
  const packageId: TablePackageId | undefined =
    packCode === "REG"
      ? "regular"
      : packCode === "PRE"
        ? "premium"
        : packCode === "COM"
          ? "communal"
          : packCode === "SOF"
            ? "sofa"
            : packCode === "STA"
              ? "regular"
              : packCode === "VIP"
                ? "sofa"
                : undefined;

  return { nightId, packageId };
}
