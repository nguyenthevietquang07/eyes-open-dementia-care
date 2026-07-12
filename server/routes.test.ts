import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app";
import { MemStorage } from "./storage";

let server: Server;
let baseUrl: string;

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

async function register(email: string) {
  const response = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      displayName: email.split("@")[0],
    }),
  });
  assert.equal(response.status, 201);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return cookie;
}

describe("Eyes Open API", () => {
  beforeEach(async () => {
    const app = await createApp({
      storage: new MemStorage({ persist: false }),
      serveClient: false,
    });
    server = app.server;
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("requires authentication for care records", async () => {
    const response = await request("/api/reminders");
    assert.equal(response.status, 401);
  });

  it("creates, completes, and deletes reminders for the signed-in user", async () => {
    const cookie = await register("caregiver@example.com");

    const createResponse = await request("/api/reminders", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        title: "Take medicine",
        description: "Morning dose",
        scheduledFor: new Date().toISOString(),
        completed: false,
      }),
    });
    assert.equal(createResponse.status, 201);
    const reminder = (await createResponse.json()) as { id: string; completed: boolean };
    assert.equal(reminder.completed, false);

    const completeResponse = await request(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { Cookie: cookie },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(completeResponse.status, 200);
    const completed = (await completeResponse.json()) as { completed: boolean };
    assert.equal(completed.completed, true);

    const deleteResponse = await request(`/api/reminders/${reminder.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert.equal(deleteResponse.status, 204);
  });

  it("stores large label image payloads after authentication", async () => {
    const cookie = await register("labeler@example.com");
    const imageData = `data:image/jpeg;base64,${Buffer.alloc(200_000, 1).toString("base64")}`;

    const response = await request("/api/labels", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        name: "Pen",
        category: "object",
        imageData,
        detectedObjects: ["pen"],
      }),
    });
    assert.equal(response.status, 201);
    const label = (await response.json()) as { id: string; imageData: string };
    assert.equal(label.imageData, imageData);
  });

  it("keeps reminders scoped to each caregiver account", async () => {
    const firstCookie = await register("first@example.com");
    const secondCookie = await register("second@example.com");

    const createResponse = await request("/api/reminders", {
      method: "POST",
      headers: { Cookie: firstCookie },
      body: JSON.stringify({
        title: "Private reminder",
        scheduledFor: new Date().toISOString(),
      }),
    });
    const reminder = (await createResponse.json()) as { id: string };

    const secondListResponse = await request("/api/reminders", {
      headers: { Cookie: secondCookie },
    });
    assert.equal(secondListResponse.status, 200);
    assert.deepEqual(await secondListResponse.json(), []);

    const crossUserPatch = await request(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { Cookie: secondCookie },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(crossUserPatch.status, 404);
  });
});
