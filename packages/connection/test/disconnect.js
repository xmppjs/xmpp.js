import Connection from "../index.js";

test("disconnect", async () => {
  const conn = new Connection();

  const el = {};
  const spy_closeStream = jest
    .spyOn(conn, "_closeStream")
    .mockImplementation(async () => el);
  const spy_closeSocket = jest.spyOn(conn, "_closeSocket");

  expect(await conn.disconnect()).toBe(el);

  expect(spy_closeStream).toHaveBeenCalledTimes(1);
  expect(spy_closeSocket).toHaveBeenCalledTimes(1);
});

test("disconnect with _closeStream rejection", async () => {
  const conn = new Connection();

  const spy_closeStream = jest
    .spyOn(conn, "_closeStream")
    .mockImplementation(() => {
      return Promise.reject();
    });
  const spy_closeSocket = jest.spyOn(conn, "_closeSocket");

  await conn.disconnect();

  expect(spy_closeStream).toHaveBeenCalledTimes(1);
  expect(spy_closeSocket).toHaveBeenCalledTimes(1);
});

test("disconnect with _closeSocket rejection", async () => {
  const conn = new Connection();

  const spy_closeStream = jest.spyOn(conn, "_closeStream");
  const spy_closeSocket = jest
    .spyOn(conn, "_closeSocket")
    .mockImplementation(() => {
      return Promise.reject();
    });

  await conn.disconnect();

  expect(spy_closeStream).toHaveBeenCalledTimes(1);
  expect(spy_closeSocket).toHaveBeenCalledTimes(1);
});

test("disconnect with _closeStream and _closeSocket rejections", async () => {
  const conn = new Connection();

  const spy_closeStream = jest
    .spyOn(conn, "_closeStream")
    .mockImplementation(() => {
      return Promise.reject();
    });
  const spy_closeSocket = jest
    .spyOn(conn, "_closeSocket")
    .mockImplementation(() => {
      return Promise.reject();
    });

  await conn.disconnect();

  expect(spy_closeStream).toHaveBeenCalledTimes(1);
  expect(spy_closeSocket).toHaveBeenCalledTimes(1);
});

test("resolves if socket property is undefined", async () => {
  const conn = new Connection();
  conn.footerElement = () => <foo />;
  conn.socket = undefined;
  await conn.disconnect();
  expect().pass();
});

test("does not reject if connection is not established", async () => {
  const conn = new Connection();
  await conn.disconnect();
  expect().pass();
});
