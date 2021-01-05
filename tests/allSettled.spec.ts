import { allSettled } from '../src/promises';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const error = new Error("That's odd...");

jest.setTimeout(60000);

describe('allSettled', () => {
  it('should throttle promise executions', async () => {
    const createPromise = (i: number) => async (): Promise<number> => {
      await sleep(1);
      return i;
    };

    const promises: (() => Promise<number>)[] = [];
    // need 11, to make it 100ms since they complete in 1ms
    for (let i = 0; i < 11; i++) {
      promises.push(createPromise(i));
    }

    const start = Date.now();
    await allSettled(promises, { limit: 1, throttle: 10 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(100);
  });

  it('should limit promise executions', async () => {
    const createPromise = (i: number) => async (): Promise<number> => {
      await sleep(10);
      return i;
    };

    const promises: (() => Promise<number>)[] = [];
    // need 11, to make it 100ms since they complete in 1ms
    for (let i = 0; i < 11; i++) {
      promises.push(createPromise(i));
    }

    let start = Date.now();
    await allSettled(promises, { limit: 1 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(100);

    start = Date.now();
    await allSettled(promises, { limit: 11 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
    expect(Date.now() - start).toBeLessThanOrEqual(100);
  });

  it('should have same output as Promise.allSettled', async () => {
    const createPromise = (i: number) => async (): Promise<number> => {
      await sleep(10 * Math.random()); // out of order results
      return i;
    };

    const promises: (() => Promise<number>)[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(createPromise(i));
    }

    const results = await allSettled(promises);
    const results2 = await Promise.allSettled(promises.map((fn) => fn()));
    expect(results).toEqual(results2);
  });

  it('should have same output as Promise.allSettled for errors', async () => {
    const createPromise = (i: number) => async (): Promise<number> => {
      await sleep(10 * Math.random()); // out of order results
      if (i % 2 !== 0) throw error;
      return i;
    };

    const promises: (() => Promise<number>)[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(createPromise(i));
    }

    const results = await allSettled(promises);
    const results2 = await Promise.allSettled(promises.map((fn) => fn()));
    expect(results).toEqual(results2);
  });
});
