import { sortSrv as sort } from "../lib/dns.js";

test("by priority", () => {
  expect(
    sort([
      { priority: 2, weight: 0 },
      { priority: 1, weight: 0 },
    ]),
  ).toEqual([
    { priority: 1, weight: 0 },
    { priority: 2, weight: 0 },
  ]);

  expect(
    sort([
      { priority: 2, weight: 1 },
      { priority: 1, weight: 0 },
    ]),
  ).toEqual([
    { priority: 1, weight: 0 },
    { priority: 2, weight: 1 },
  ]);
});

test("by weight", () => {
  expect(
    sort([
      { weight: 1, priority: 0 },
      { weight: 2, priority: 0 },
    ]),
  ).toEqual([
    { weight: 2, priority: 0 },
    { weight: 1, priority: 0 },
  ]);

  expect(
    sort([
      { weight: 2, priority: 0 },
      { weight: 1, priority: 0 },
    ]),
  ).toEqual([
    { weight: 2, priority: 0 },
    { weight: 1, priority: 0 },
  ]);
});
