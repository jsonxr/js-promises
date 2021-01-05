import { Observable } from '../src/Observable';
import { delay } from '../src/delay';

const throttler = (throttle: number = 10) => {
  let _lastTime = 0;

  // Used for throttling
  return async () => {
    const currentTime = Date.now();
    const ms = _lastTime + throttle - currentTime;
    if (ms > 0) {
      _lastTime = currentTime + ms;
      await delay(ms);
    } else {
      _lastTime = currentTime;
    }
  };
};

// class Throttler {
//   _lastTime = 0;
//   _throttle = 10;

//   constructor(options?: { throttle?: number }) {
//     this._throttle = options?.throttle ?? this._throttle;
//   }

//   // Used for throttling
//   async throttle() {
//     const currentTime = Date.now();
//     const ms = this._lastTime + this._throttle - currentTime;
//     if (ms > 0) {
//       this._lastTime = currentTime + ms;
//       await delay(ms);
//     } else {
//       this._lastTime = currentTime;
//     }
//   }
// }

type Subscriber<T> = { error?: any; value?: T };

class PromiseFn<T> {
  private observable = new Observable<Subscriber<T>>();

  constructor(public key: string, private fn: () => Promise<T>) {}

  subscribe = this.observable.subscribe.bind(this.observable);

  getPromise(): Promise<T> {
    return this.fn()
      .then((value) => {
        this.observable.notify({ value });
        return value;
      })
      .catch((error) => {
        this.observable.notify({ error });
        throw error;
      });
  }
}

export class PromiseCache<T> {
  promises: Record<string, Promise<T>> = {};
  functions: Record<string, PromiseFn<T>> = {};
  queue: PromiseFn<T>[] = [];
  throttler = throttler();

  async execute(fn: PromiseFn<T>) {
    await throttler();
    delete this.functions[fn.key];
    const promise: Promise<T> = fn.getPromise();
    this.promises[fn.key] = promise;
  }

  process() {
    const fn = this.queue.shift();
    if (fn) {
      this.execute(fn);
    }
  }

  get(key: string, fn: () => Promise<T>): Promise<T> {
    key = key.toLowerCase();

    // first check our promises, if we find one, return it...
    const promise = this.promises[key];
    if (promise) {
      console.log('and you get a promise: ', key);
      return promise;
    }

    // The promise hasn't been created yet...
    return new Promise<T>((resolve, reject) => {
      let entry = this.functions[key];
      if (!entry) {
        console.log('creating ', key);
        // First time we've been asked, queue up the promise function
        entry = new PromiseFn(key, fn);
        this.functions[key] = entry;
        this.queue.push(entry);

        // Kick off the process
        console.log(
          'before process: promises=',
          Object.keys(this.promises),
          'queue=',
          this.queue.map((q) => q.key),
          'functions=',
          Object.keys(this.functions)
        );
        this.process();
        console.log(
          'after process: ',
          Object.keys(this.promises),
          this.queue.map((q) => q.key),
          Object.keys(this.functions)
        );
      }

      entry.subscribe(({ error, value }: Subscriber<T>) => {
        console.log('and you get to subscribe', key);
        if (error) {
          reject(error);
        }
        resolve(value!);
      });
    });
  }
}

describe('PromiseCache', () => {
  it.only('should work', async () => {
    const promises = new PromiseCache<string>();
    //const fn = async (value: string) => await value;
    const fn: any = jest.fn().mockResolvedValue('stud4.dat');
    const fn2: any = jest.fn().mockResolvedValue('stud5.dat');

    const promise = Promise.all([
      promises.get('stud4.dat', () => {
        console.log('1 get stud4.dat');
        return fn('stud4.dat');
      }),
      promises.get('stud4.dat', () => {
        console.log('2 get stud4.dat');
        return fn('stud4.dat');
      }),
      promises.get('stud4.dat', () => {
        console.log('3 get stud4.dat');
        return fn('stud4.dat');
      }),
    ]);

    const promise2 = Promise.all([
      promises.get('stud4.dat', () => {
        console.log('4 get stud4.dat');
        return fn('stud4.dat');
      }),
      promises.get('stud5.dat', () => {
        console.log('1 get stud5.dat');
        return fn2('stud5.dat');
      }),
      promises.get('stud5.dat', () => {
        console.log('2 get stud5.dat');
        return fn2('stud5.dat');
      }),
    ]);

    const result = await promise;
    const result2 = await promise2;
    expect(result).toEqual(['stud4.dat', 'stud4.dat', 'stud4.dat']);
    expect(result2).toEqual(['stud4.dat', 'stud5.dat', 'stud5.dat']);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('stud4.dat');

    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledWith('stud5.dat');

    //expect(Object.keys(promises.queue)).toEqual([]);
  });
});
