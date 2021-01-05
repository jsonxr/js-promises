import { delay } from './delay';

export interface PromisesOptions {
  limit?: number;
  throttle?: number;
}

export async function all<T>(
  array: (() => Promise<T>)[],
  options: PromisesOptions = {}
): Promise<T[]> {
  const results = promises<T, T>(array, options, (err: any, value?: T) => {
    if (err) {
      throw err;
    }
    return value!;
  });
  return results;
}

export async function allSettled<T>(
  array: (() => Promise<T>)[],
  options: PromisesOptions = {}
): Promise<PromiseSettledResult<T>[]> {
  const results = promises<T, PromiseSettledResult<T>>(
    array,
    options,
    (err: any, value?: T): PromiseSettledResult<T> => {
      if (err) {
        return { status: 'rejected', reason: err };
      }
      return { status: 'fulfilled', value: value! };
    }
  );

  return results;
}

async function promises<T, Result>(
  array: (() => Promise<T>)[],
  { limit = 6, throttle = 0 }: PromisesOptions,
  resultFn: (error: any, value?: T) => Result
): Promise<Result[]> {
  // PromiseSettledResult<T>[]
  const list = [...array]; // Clone the array so we can manipulate
  const count = list.length;
  let complete = 0;
  let index = 0;
  const results: Result[] = [];
  let lastTime = 0;
  let currentTime;

  // Used for throttling
  const performThrottle = async () => {
    currentTime = Date.now();
    const ms = lastTime + throttle - currentTime;
    if (ms > 0) {
      lastTime = currentTime + ms;
      await delay(ms);
    } else {
      lastTime = currentTime;
    }
  };

  return new Promise((resolve, reject) => {
    const execute = async (i: number) => {
      // Are there any more promises we need to execute?
      const fn = list.shift();
      if (!fn) {
        // Promises can complete out of order
        if (complete === count) {
          resolve(results);
        }
        return;
      }

      await performThrottle();
      fn()
        .then((value: T) => {
          results[i] = resultFn(null, value);
          //.allSettled => results[i] = { status: 'fulfilled', value };
          //.all => results[i] = value;
        })
        .catch((reason) => {
          try {
            results[i] = resultFn(reason);
          } catch (err) {
            reject(err);
          }
          //.allSettled = results[i] = { status: 'rejected', reason };
          //.all throw...
        })
        .finally(() => {
          complete++;
          execute(index);
          index++;
        });
    };

    // // Kick off the first {concurrency} promises...
    for (let i = 0; i < limit; i++) {
      execute(index);
      index++;
    }
  });
}
