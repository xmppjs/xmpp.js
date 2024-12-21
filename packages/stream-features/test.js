import streamfeatures from "./index.js";
import { xml } from "@xmpp/test";

test.skip("selectFeature", () => {
  const features = [];
  features.push(
    {
      priority: 1000,
      run: () => {},
      match: (el) => el.getChild("bind"),
    },
    {
      priority: 2000,
      run: () => {},
      match: (el) => el.getChild("bind"),
    },
  );

  const feature = streamfeatures.selectFeature(
    features,
    xml("foo", {}, xml("bind")),
  );
  expect(feature.priority).toBe(2000);
});
