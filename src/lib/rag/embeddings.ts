import { appConfig } from "@/config/app-config";

type Pipeline = (
  input: string | string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

let pipelinePromise: Promise<Pipeline> | null = null;

async function getPipeline(): Promise<Pipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const mod = await import("@xenova/transformers");
      mod.env.allowLocalModels = false;
      mod.env.useBrowserCache = true;
      const pipe = (await mod.pipeline(
        "feature-extraction",
        appConfig.embedding.model,
      )) as unknown as Pipeline;
      return pipe;
    })();
  }
  return pipelinePromise;
}

/** Warm the model in the background. */
export function warmupEmbeddings(): void {
  void getPipeline().catch(() => {
    /* ignore — surfaced later */
  });
}

export async function embedTexts(
  texts: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Float32Array[]> {
  const pipe = await getPipeline();
  const out: Float32Array[] = [];
  const batchSize = 8;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await pipe(batch, { pooling: "mean", normalize: true });
    const dims = res.dims[res.dims.length - 1];
    for (let j = 0; j < batch.length; j++) {
      out.push(new Float32Array(res.data.slice(j * dims, (j + 1) * dims)));
    }
    onProgress?.(Math.min(i + batch.length, texts.length), texts.length);
  }
  return out;
}

export async function embedQuery(text: string): Promise<Float32Array> {
  const [vec] = await embedTexts([text]);
  return vec;
}