import assert from "node:assert/strict";
import { test } from "node:test";

import { safeToolProcessor } from "../dist/tools/safe-tool-processor.js";

function getText(result) {
  assert.ok(result);
  assert.ok(Array.isArray(result.content));
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, "text");
  assert.equal(typeof result.content[0].text, "string");
  return result.content[0].text;
}

async function withEnv(patch, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(patch)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("safeToolProcessor: object -> JSON string", async () => {
  const result = await safeToolProcessor(Promise.resolve({ isError: false, content: { a: 1 } }));
  assert.equal(result.isError, false);
  assert.equal(getText(result), JSON.stringify({ a: 1 }));
});

test("safeToolProcessor: string -> returned as-is (no extra quotes)", async () => {
  const result = await safeToolProcessor(Promise.resolve({ isError: false, content: "hello" }));
  assert.equal(result.isError, false);
  assert.equal(getText(result), "hello");
});

test("safeToolProcessor: circular content does not throw", async () => {
  const circular = {};
  circular.self = circular;
  const result = await safeToolProcessor(Promise.resolve({ isError: false, content: circular }));
  assert.equal(result.isError, false);
  const text = getText(result);
  assert.ok(text.length > 0);
});

test("safeToolProcessor: large string -> structured truncation", async () => {
  const long = "a".repeat(200);
  const result = await withEnv(
    { MCP_MAX_TOOL_RESPONSE_CHARS: "100", MCP_MAX_TOOL_RESPONSE_ITEMS: undefined },
    async () => safeToolProcessor(Promise.resolve({ isError: false, content: long }))
  );
  const parsed = JSON.parse(getText(result));
  assert.equal(parsed.truncated, true);
  assert.equal(parsed.maxChars, 100);
  assert.equal(parsed.originalChars, 200);
  assert.equal(typeof parsed.preview, "string");
  assert.ok(parsed.preview.length <= 2000);
});

test("safeToolProcessor: large array -> item truncation", async () => {
  const content = Array.from({ length: 100 }, (_, i) => `item-${i}-${"x".repeat(20)}`);
  const result = await withEnv(
    { MCP_MAX_TOOL_RESPONSE_CHARS: "100", MCP_MAX_TOOL_RESPONSE_ITEMS: "10" },
    async () => safeToolProcessor(Promise.resolve({ isError: false, content }))
  );

  const parsed = JSON.parse(getText(result));
  assert.equal(parsed.truncated, true);
  assert.equal(parsed.originalItems, 100);
  assert.equal(parsed.returnedItems, 10);
  assert.equal(parsed.items.length, 10);
});

test("safeToolProcessor: large {items: []} -> item truncation", async () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `name-${i}-${"y".repeat(20)}` }));
  const content = { total: 100, offset: 0, limit: 100, items };
  const result = await withEnv(
    { MCP_MAX_TOOL_RESPONSE_CHARS: "150", MCP_MAX_TOOL_RESPONSE_ITEMS: "7" },
    async () => safeToolProcessor(Promise.resolve({ isError: false, content }))
  );

  const parsed = JSON.parse(getText(result));
  assert.equal(parsed.truncated, true);
  assert.equal(parsed.originalItems, 100);
  assert.equal(parsed.returnedItems, 7);
  assert.equal(parsed.items.length, 7);
  assert.equal(parsed.total, 100);
});
