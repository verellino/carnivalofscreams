import assert from "node:assert/strict";
import test from "node:test";

import {
  getSeat,
  mapViewForBookable,
  mapViewForPackage,
  MAP_VIEWBOX,
  nearestSeat,
  SEATS,
  seatsForPackage,
} from "./seats";

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

test("printed Tivex tables sit in the purple block, not on Luxer", () => {
  const t12 = getSeat("tivex-12")!;
  const t8 = getSeat("tivex-8")!;
  const l18 = getSeat("luxer-18")!;

  assert.ok(t12.x < l18.x, "T12 is left of L18");
  assert.ok(t12.y > l18.y, "T12 is below the Luxer sofa row");
  assert.ok(t12.x < t8.x, "T12 is left of T8");
  assert.ok(t12.y > t8.y, "T12 is below T8");

  const hitT12 = nearestSeat(t12.x, t12.y);
  assert.equal(hitT12?.id, "tivex-12");
  const hitT8 = nearestSeat(t8.x, t8.y);
  assert.equal(hitT8?.id, "tivex-8");
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

test("bookable view keeps every table and drops empty Resid space", () => {
  const bookable = mapViewForBookable();
  assert.ok(bookable.width < MAP_VIEWBOX.width || bookable.height < MAP_VIEWBOX.height);
  for (const seat of SEATS) {
    assert.ok(seat.x >= bookable.x && seat.x <= bookable.x + bookable.width);
    assert.ok(seat.y >= bookable.y && seat.y <= bookable.y + bookable.height);
  }
});
