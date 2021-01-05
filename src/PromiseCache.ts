export class PromiseCache<T> {
  _promises: Record<string, () => Promise<T> | Promise<T>> = {};

  get(key: string, fn: () => Promise<T>): void {}
}
