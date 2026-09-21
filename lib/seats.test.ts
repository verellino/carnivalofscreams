import assert from "node:assert/strict";
import test from "node:test";

import { getSeat, mapViewForPackage, SEATS, seatsForPackage } from "./seats";

test("floor plan has every COS26 table", () => {
  assert.equal(seatsForPackage("luxer").length, 26);
  assert.equal(seatsForPackage("etius").length, 4);
  assert.equal(seatsForPackage("tivex").length, 17);
  assert.equal(seatsForPackage("perio").length, 3);
  assert.equal(seatsForPackage("onomy").length, 10);
  assert.equal(SEATS.length, 60);

  const ids = SEATS.map((seat) => seat.id);
  assert.equal(new Set(ids).size, ids.length);

  assert.equal(getSeat("luxer-13")?.short, "L13");
  assert.equal(getSeat("etius-4")?.short, "E4");
  assert.equal(getSeat("tivex-17")?.short, "T17");
  assert.equal(getSeat("perio-2")?.short, "P2");
  assert.equal(getSeat("onomy-10")?.short, "O10");
});

test("map view zooms to an area without leaving the floor plan", () => {
  const full = mapViewForPackage();
  assert.equal(full.x, 0);
  assert.equal(full.y, 0);
  assert.equal(full.width, 2400);
  assert.equal(full.height, 1742);

  const tivex = mapViewForPackage("tivex");
  assert.ok(tivex.width < full.width || tivex.height < full.height);
  assert.ok(tivex.x >= 0);
  assert.ok(tivex.y >= 0);
  assert.ok(tivex.x + tivex.width <= full.width + 0.01);
  assert.ok(tivex.y + tivex.height <= full.height + 0.01);

  const t6 = getSeat("tivex-6")!;
  assert.ok(t6.x >= tivex.x && t6.x <= tivex.x + tivex.width);
  assert.ok(t6.y >= tivex.y && t6.y <= tivex.y + tivex.height);
});
