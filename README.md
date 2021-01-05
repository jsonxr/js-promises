# PromisePool

```
yarn add @jsonxr/promises
```

A pool of promises that will limit the number of executions that will concurrently execute.  If you are making API calls using the standard built-in promises, all the promises are executed simultaneously which can cause problems with rate limiting. This will limit the number of concurrent executions.

## `all(array, options)`

Performs the same function as [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) but throttles the creation of promises and limits the number of concurrent promises.

### Parameters
* `array` - An array of functions that create promises
* `options` -
  * `limit` - Maximum number of promises
  * `throttled` - min number of ms to wait before creating the promise


### Example

```javascript
import { all } from '@jsonxr/promises';

const fn = async (i) => i;

const promises = []
promises.push(() => fn(1));
promises.push(() => fn(2));
promises.push(() => fn(3));
promises.push(() => fn(4));
all(promises, { limit: 2, throttle: 100 })
  .then(results => console.log(results))
```

output
```
{ status: 'fulfilled', value: [1,2,3,4] }
```

## allSettled

```javascript
import { allSettled } from '@jsonxr/promises';

const fn = async (i) => {
  if (i % 2 !== 0) throw new Error("That's odd");
  return i;
};

const promises = []
promises.push(() => fn(1));
promises.push(() => fn(2));
promises.push(() => fn(3));
promises.push(() => fn(4));
allSettled(promises, { limit: 2, throttle: 100 })
  .then(results => console.log(results))
```

output
```
[
  { status: 'rejected', reason: Error: That's odd },
  { status: 'fulfilled', value: 2 },
  { status: 'rejected', reason: Error: That's odd },
  { status: 'fulfilled', value: 4 }
]
```

## Do not do this

Promises are scheduled for execution the moment they are created. PromisePool therefore expects a promise creator function, not a promise.

```javascript
const fn = async (i) => i; // Promise function

const promises = [];

// Do this
promises.push(() => fn(1));

// ERROR. Don't do this!!!
promises.push(fn(1));
```