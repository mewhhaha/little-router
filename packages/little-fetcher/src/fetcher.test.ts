import { assertType, describe, expect, it } from "vitest";
import { fetcher } from "./fetcher.js";
import { JSONString } from "@mewhhaha/json-string";
import { Router, RoutesOf } from "@mewhhaha/little-router";
import { text } from "@mewhhaha/typed-response";

const mock = <
  R extends { handle: (request: Request) => Promise<Response> | Response }
>(
  r: R
): { fetch: typeof fetch } => ({
  fetch: async (url, init) => {
    const request = new Request(url, init);
    return r.handle(request);
  },
});

describe("fetcher", () => {
  it("should fetch a route with one param", async () => {
    const router = Router().get("/users/:id", [], async ({ params }) => {
      return text(200, `User: ${params.id}`);
    });

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    const response = await f.get("/users/1");
    const t = await response.text();
    assertType<`User: ${string}`>(t);
    expect(response.status).toBe(200);
    expect(t).toBe(`User: 1`);
  });

  it("should fetch a route with two params", async () => {
    const router = Router().get(
      "/users/:id/cats/:cat",
      [],
      async ({ params }) => {
        return text(200, `User: ${params.id}, Cat: ${params.cat}`);
      }
    );

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    const response = await f.get(`/users/1/cats/2`);
    const t = await response.text();
    assertType<`User: ${string}, Cat: ${string}`>(t);
    expect(response.status).toBe(200);
    expect(t).toBe(`User: 1, Cat: 2`);
  });

  it("should fetch a route with two routes", async () => {
    const router = Router()
      .get("/users/:id/cats/:cat", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Cat: ${params.cat}`);
      })
      .get("/users/:id/dogs/:dog", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Dog: ${params.dog}`);
      });

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    const response = await f.get(`/users/1/cats/2`);
    const t = await response.text();
    assertType<`User: ${string}, Cat: ${string}`>(t);
    expect(response.status).toBe(200);
    expect(t).toBe(`User: 1, Cat: 2`);
  });

  it("should fetch a route with different routes", async () => {
    const router = Router()
      .get("/users/:id/cats/:cat", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Cat: ${params.cat}`);
      })
      .post("/users/:id/dogs/:dog", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Dog: ${params.dog}`);
      });

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    const response = await f.post("/users/1/dogs/2");
    const t = await response.text();
    assertType<`User: ${string}, Dog: ${string}`>(t);
    expect(response.status).toBe(200);
    expect(t).toBe(`User: 1, Dog: 2`);
  });

  it("should not show post route in get route", async () => {
    const router = Router()
      .get("/users/:id/cats/:cat", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Cat: ${params.cat}`);
      })
      .post("/users/:id/dogs/:dog", [], async ({ params }) => {
        return text(200, `User: ${params.id}, Dog: ${params.dog}`);
      });

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    //@ts-expect-error
    await f.get("/users/:id/dogs/:dog");
  });

  it.skip("should give error on missing headers", async () => {
    const plugin = async (
      _: Request,
      _init?: { headers: { "X-Header": "value" } }
    ) => {
      return {};
    };

    const router = Router().post(
      "/users/:id/dogs/:dog",
      [plugin],
      async ({ params }) => {
        return text(200, `User: ${params.id}, Dog: ${params.dog}`);
      }
    );

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    // @ts-expect-error
    f.post("/users/:id/dogs/:dog");

    // @ts-expect-error
    f.post("/users/:id/dogs/:dog", { headers: {} });

    f.post("/users/:id/dogs/:dog", { headers: { "X-Header": "value" } });
  });

  it.skip("should give error on missing body", async () => {
    const plugin = async (_: Request, _init?: { body: "body" }) => {
      return {};
    };

    const router = Router().post(
      "/users/:id/dogs/:dog",
      [plugin],
      async ({ params }) => {
        return text(200, `User: ${params.id}, Dog: ${params.dog}`);
      }
    );

    const f = fetcher<RoutesOf<typeof router>>(mock(router));

    // @ts-expect-error
    f.post("/users/:id/dogs/:dog");

    f.post("/users/:id/dogs/:dog", {
      body: "body",
    });
  });
});
