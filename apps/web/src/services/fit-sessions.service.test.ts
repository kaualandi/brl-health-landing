import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("@/lib/axios", () => ({ api: { post: (...a: unknown[]) => post(...a), get: vi.fn() } }));

const store = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
});

const { classify, clearFitSessions, flushQueue, loadFailed, loadQueue, submitSession } = await import("./fit-sessions.service");

const payload = (clientId: string) => ({ clientId, dayIndex: 0, dayName: "Treino A", startedAt: "a", finishedAt: "b", sets: [] });
const err = (status?: number) => Object.assign(new Error("falhou"), { status });

beforeEach(() => {
  store.clear();
  post.mockReset();
});

describe("classify", () => {
  it("separa enviado, recusado e transitório", () => {
    expect(classify(200)).toBe("sent");
    expect(classify(400)).toBe("rejected");
    expect(classify(404)).toBe("rejected");
    for (const s of [undefined, 500, 503, 401, 429]) expect(classify(s)).toBe("retry");
  });
});

describe("flushQueue", () => {
  it("2xx sai da fila", async () => {
    post.mockResolvedValue({});
    expect((await submitSession("u", payload("1"))).left).toBe(0);
    expect(loadQueue("u")).toEqual([]);
  });

  it("5xx e rede continuam na fila", async () => {
    post.mockRejectedValueOnce(err(503));
    expect((await submitSession("u", payload("1"))).left).toBe(1);
    post.mockRejectedValueOnce(err());
    expect(await flushQueue("u")).toBe(1);
    expect(loadQueue("u")).toHaveLength(1);
    expect(loadFailed("u")).toEqual([]);
  });

  it("4xx vai pros recusados com a mensagem e conta como pendente", async () => {
    post.mockRejectedValue(err(400));
    expect(await submitSession("u", payload("1"))).toEqual({ left: 1, rejected: "falhou" });
    expect(loadQueue("u")).toEqual([]);
    expect(loadFailed("u")).toEqual([{ payload: payload("1"), error: "falhou" }]);
  });
});

describe("clearFitSessions", () => {
  it("apaga só as chaves do usuário", async () => {
    post.mockRejectedValue(err(503));
    await submitSession("u", payload("1"));
    await submitSession("v", payload("2"));
    clearFitSessions("u");
    expect(loadQueue("u")).toEqual([]);
    expect(loadQueue("v")).toHaveLength(1);
  });
});
