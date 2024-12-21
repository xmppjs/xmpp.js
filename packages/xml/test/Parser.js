import Parser from "../lib/Parser.js";

test("stream parser", (done) => {
  const parser = new Parser();

  expect.assertions(5);

  let startElement;

  parser.on("start", (el) => {
    expect(el.toString()).toBe("<foo/>");
    startElement = el;
  });

  parser.on("element", (el) => {
    expect(el.parent).toBe(startElement);
    expect(startElement.children).toHaveLength(0);
    expect(el.toString()).toBe("<bar>hello</bar>");
  });

  parser.on("end", (el) => {
    expect(el.toString()).toBe("<foo/>");
    done();
  });

  parser.write("<foo><bar>hello</bar></foo>");
});
