import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTelegramLead,
  sendTelegramDocument,
  sendTelegramLead,
} from "../server/notifications/telegram.ts";

const notification = {
  publicNumber: "KK-1<&>",
  name: "Сергій <admin>",
  phoneNormalized: "+380660570987",
  categorySnapshot: "Стела & підставка",
  message: "Текст > тест",
  attachmentCount: 2,
};

test("escapes all user-controlled Telegram HTML fields", () => {
  const text = formatTelegramLead(notification);

  assert.doesNotMatch(text, /<admin>/);
  assert.match(text, /KK-1&lt;&amp;&gt;/);
  assert.match(text, /Сергій &lt;admin&gt;/);
  assert.match(text, /Стела &amp; підставка/);
  assert.match(text, /Текст &gt; тест/);
  assert.match(text, /Вкладення: 2 фото доступні в захищеній адмінці/);
});

test("classifies Telegram 401 as a permanent error without leaking the token", async () => {
  const token = "123456:SUPER_SECRET_TOKEN";
  const result = await sendTelegramLead(
    async () => new Response(null, { status: 401 }),
    token,
    "-1001",
    notification,
  );

  assert.deepEqual(result, {
    ok: false,
    retryable: false,
    errorCode: "TELEGRAM_HTTP_401",
  });
  assert.doesNotMatch(JSON.stringify(result), new RegExp(token));
});

test("classifies a network exception as retryable without returning raw details", async () => {
  const result = await sendTelegramLead(
    async () => {
      throw new Error("socket failed with private payload");
    },
    "secret-token",
    "-1001",
    notification,
  );

  assert.deepEqual(result, {
    ok: false,
    retryable: true,
    errorCode: "TELEGRAM_NETWORK_ERROR",
  });
  assert.doesNotMatch(JSON.stringify(result), /private payload|secret-token/);
});

test("does not mark a malformed 200 response as delivered", async () => {
  const result = await sendTelegramLead(
    async () => new Response("not-json", { status: 200 }),
    "secret-token",
    "-1001",
    notification,
  );

  assert.deepEqual(result, {
    ok: false,
    retryable: true,
    errorCode: "TELEGRAM_INVALID_RESPONSE",
  });
});

test("sends an attachment as a Telegram document with its original name", async () => {
  let requestUrl = "";
  let requestBody: FormData | undefined;

  const result = await sendTelegramDocument(
    async (input, init) => {
      requestUrl = String(input);
      requestBody = init?.body as FormData;
      return Response.json({ ok: true });
    },
    "secret-token",
    "-1001",
    {
      originalName: "приклад.jpg",
      mime: "image/jpeg",
      body: new TextEncoder().encode("image-bytes").buffer,
    },
  );

  assert.deepEqual(result, { ok: true });
  assert.match(requestUrl, /\/sendDocument$/);
  assert.equal(requestBody?.get("chat_id"), "-1001");
  const document = requestBody?.get("document");
  assert.ok(document instanceof File);
  assert.equal(document.name, "приклад.jpg");
  assert.equal(document.type, "image/jpeg");
});
