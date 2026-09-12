declare module "*.mjs" {
  export function strFromU8(value: Uint8Array): string;
  export function unzipSync(value: Uint8Array): Record<string, Uint8Array>;
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(options: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(page: number): Promise<{
        getTextContent(): Promise<{ items: Array<{ str: string }> }>;
      }>;
    }>;
  };
}
