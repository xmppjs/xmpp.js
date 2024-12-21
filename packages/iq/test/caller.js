import { mockClient, mockInput } from "@xmpp/test";
import StanzaError from "@xmpp/middleware/lib/StanzaError.js";

test("#request", (done) => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  xmpp.send = (el) => {
    expect(el).toEqual(
      <iq type="get" id="foobar">
        <foo />
      </iq>,
    );
    done();
    return Promise.resolve();
  };

  iqCaller.request(
    <iq type="get" id="foobar">
      <foo />
    </iq>,
  );
});

test("removes the handler if sending failed", async () => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const error = new Error("foobar");

  xmpp.send = () => {
    return Promise.reject(error);
  };

  const promise = iqCaller.request(
    <iq type="get">
      <foo />
    </iq>,
  );

  expect(iqCaller.handlers.size).toBe(1);

  try {
    await promise;
  } catch (err) {
    expect(err).toBe(error);
    expect(iqCaller.handlers.size).toBe(0);
  }
});

test("resolves with with the stanza for result reply", async () => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const id = "foo";

  const promiseRequest = iqCaller.request(<iq type="get" id={id} />);

  const reply = <iq type="result" id={id} />;
  mockInput(xmpp, reply);

  expect(await promiseRequest).toEqual(reply);
});

test("rejects with a StanzaError for error reply", async () => {
  expect.assertions(1);
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const id = "foo";

  const promiseRequest = iqCaller.request(<iq type="get" id={id} />);

  const errorElement = (
    <error type="modify">
      <service-unavailable />
    </error>
  );
  const stanzaElement = (
    <iq type="error" id={id}>
      {errorElement}
    </iq>
  );
  mockInput(xmpp, stanzaElement);

  try {
    await promiseRequest;
  } catch (err) {
    expect(err).toEqual(StanzaError.fromElement(errorElement));
  }
});

test("rejects with a TimeoutError if no answer is received within timeout", async () => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const promise = iqCaller.request(
    <iq type="get">
      <foo />
    </iq>,
    1,
  );

  expect(iqCaller.handlers.size).toBe(1);

  try {
    await promise;
  } catch (err) {
    expect(err.name).toBe("TimeoutError");
    expect(iqCaller.handlers.size).toBe(0);
  }
});

test("#get", async () => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const requestChild = <foo xmlns="foo:bar" />;
  const promiseGet = iqCaller.get(requestChild, "hello@there");
  const { id } = requestChild.parent.attrs;

  const replyChild = <foo xmlns="foo:bar" />;
  const reply = (
    <iq type="result" id={id} from="hello@there">
      {replyChild}
    </iq>
  );
  mockInput(xmpp, reply);

  expect(await promiseGet).toEqual(replyChild);
});

test("#set", async () => {
  const xmpp = mockClient();
  const { iqCaller } = xmpp;

  const requestChild = <foo xmlns="foo:bar" />;
  const promiseSet = iqCaller.set(requestChild, "hello@there");
  const { id } = requestChild.parent.attrs;

  const replyChild = <foo xmlns="foo:bar" />;
  const reply = (
    <iq type="result" id={id} from="hello@there">
      {replyChild}
    </iq>
  );
  mockInput(xmpp, reply);

  expect(await promiseSet).toEqual(replyChild);
});
