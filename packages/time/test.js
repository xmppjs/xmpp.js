import * as time from "./index.js";

const s = "21 Jully 1969 02:56 UTC";
const d = new Date(s);

test("date", () => {
  expect(time.date()).toBe(time.date(new Date()));
  expect(time.date(d)).toBe("1969-07-21");
  expect(time.date(s)).toBe("1969-07-21");
});

test("time", () => {
  expect(time.time()).toBe(time.time(new Date()));
  expect(time.time(d)).toBe("02:56:00Z");
  expect(time.time(s)).toBe("02:56:00Z");
});

test("datetime", () => {
  expect(time.datetime()).toBe(time.datetime(new Date()));
  expect(time.datetime(d)).toBe("1969-07-21T02:56:00Z");
  expect(time.datetime(s)).toBe("1969-07-21T02:56:00Z");
});

function fake(value) {
  return {
    getTimezoneOffset() {
      return value;
    },
  };
}

test("offset", () => {
  expect(time.offset(fake(120))).toBe("-02:00");
  expect(time.offset(fake(-120))).toBe("+02:00");
  expect(time.offset(fake(90))).toBe("-01:30");
  expect(time.offset(fake(-90))).toBe("+01:30");
});
