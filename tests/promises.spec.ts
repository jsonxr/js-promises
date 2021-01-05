import { all } from '../src/promises';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const error = new Error("That's odd...");

jest.setTimeout(60000);

describe('promises', () => {
  it('should handle an empty array', async () => {
    const promises: (() => Promise<number>)[] = [];
    const results = await all(promises);
    expect(results?.length).toEqual(0);
  });
});
