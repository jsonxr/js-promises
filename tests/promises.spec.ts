import { all } from '../src/promises';

describe('promises', () => {
  it('should handle an empty array', async () => {
    const promises: (() => Promise<number>)[] = [];
    const results = await all(promises);
    expect(results?.length).toEqual(0);
  });
});
