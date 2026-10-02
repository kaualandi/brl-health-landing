export const BASE_URL = "https://oss.exercisedb.dev/api/v1";

export type RawExercise = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};
type Page = { meta: { total: number; hasNextPage: boolean; nextCursor?: string }; data: RawExercise[] };
type Deps = { fetch?: typeof fetch; sleep?: (ms: number) => Promise<unknown> };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const stripStep = (s: string) => s.replace(/^Step:\s*\d+\s*/i, "").trim();

export const mapExercise = (e: RawExercise) => ({
  id: e.exerciseId,
  name: e.name,
  gifUrl: e.gifUrl,
  bodyParts: e.bodyParts ?? [],
  targetMuscles: e.targetMuscles ?? [],
  secondaryMuscles: e.secondaryMuscles ?? [],
  equipments: e.equipments ?? [],
  instructions: (e.instructions ?? []).map(stripStep),
});

/** GET com retentativa e backoff exponencial em 429/5xx e erros de rede. */
export async function fetchRetry(url: string, { fetch: f = fetch, sleep = wait }: Deps = {}, tries = 5) {
  for (let i = 0; ; i++) {
    try {
      const res = await f(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
      if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} em ${url}`);
      if (i >= tries) throw new Error(`HTTP ${res.status} em ${url} após ${tries} tentativas`);
    } catch (err) {
      if (i >= tries || (err instanceof Error && err.message.startsWith("HTTP 4"))) throw err;
    }
    await sleep(500 * 2 ** i);
  }
}

/** Pagina por cursor (`after`; a API limita a página a 25), pausando entre páginas. */
export async function* fetchExercises(opts: Deps & { limit?: number; pauseMs?: number } = {}) {
  const sleep = opts.sleep ?? wait;
  const max = opts.limit ?? Infinity;
  let got = 0;
  let after: string | undefined;
  while (got < max) {
    const cursor = after ? `&after=${encodeURIComponent(after)}` : "";
    const res = await fetchRetry(`${BASE_URL}/exercises?limit=${Math.min(25, max - got)}${cursor}`, opts);
    const page = (await res.json()) as Page;
    const items = page.data.slice(0, max - got);
    if (items.length === 0) return;
    yield items;
    got += items.length;
    after = page.meta.nextCursor;
    if (!page.meta.hasNextPage || !after) return;
    await sleep(opts.pauseMs ?? 300);
  }
}
