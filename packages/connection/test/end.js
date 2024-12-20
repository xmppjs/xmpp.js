"use strict";

const Connection = require("..");

test("#_end", async () => {
  const conn = new Connection();

  const spy_close = jest.spyOn(conn, "close");
  const spy_disconnect = jest.spyOn(conn, "disconnect");

  await conn._end();

  expect(spy_close).toHaveBeenCalledTimes(1);
  expect(spy_disconnect).toHaveBeenCalledTimes(1);
});

test("#_end with close rejection", async () => {
  const conn = new Connection();

  const spy_close = jest.spyOn(conn, "close").mockImplementation(() => {
    return Promise.reject();
  });
  const spy_disconnect = jest.spyOn(conn, "disconnect");

  await conn._end();

  expect(spy_close).toHaveBeenCalledTimes(1);
  expect(spy_disconnect).toHaveBeenCalledTimes(1);
});

test("#_end with disconnect rejection", async () => {
  const conn = new Connection();

  const spy_close = jest.spyOn(conn, "close");
  const spy_disconnect = jest
    .spyOn(conn, "disconnect")
    .mockImplementation(() => {
      return Promise.reject();
    });

  await conn._end();

  expect(spy_close).toHaveBeenCalledTimes(1);
  expect(spy_disconnect).toHaveBeenCalledTimes(1);
});

test("#_end with close and disconnect rejection", async () => {
  const conn = new Connection();

  const spy_close = jest.spyOn(conn, "close").mockImplementation(() => {
    return Promise.reject();
  });
  const spy_disconnect = jest
    .spyOn(conn, "disconnect")
    .mockImplementation(() => {
      return Promise.reject();
    });

  await conn._end();

  expect(spy_close).toHaveBeenCalledTimes(1);
  expect(spy_disconnect).toHaveBeenCalledTimes(1);
});
