import assert from "node:assert/strict";
import test from "node:test";
import htmlEventAttributes from "./index.js";

test("Main", () => {
  assert.ok(Array.isArray(htmlEventAttributes));
  assert.equal(new Set(htmlEventAttributes).size, htmlEventAttributes.length);
  assert.ok(htmlEventAttributes.includes("onabort"));
  assert.ok(htmlEventAttributes.includes("onclick"));

  for (const name of htmlEventAttributes) {
    assert.ok(/^on[a-z]+$/.test(name), name);
  }
});
