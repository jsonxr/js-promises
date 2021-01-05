export class Observable<T> {
  listeners: ((data: T) => void)[] = [];

  subscribe(listener: (data: T) => void) {
    this.listeners.push(listener);
  }

  unsubscribe(listener: (data: T) => void) {
    const removeIndex = this.listeners.findIndex((obs) => {
      return listener === obs;
    });

    if (removeIndex !== -1) {
      this.listeners = this.listeners.slice(removeIndex, 1);
    }
  }

  // Loops over this.observers and calls the update method on each observer.
  // The state object will call this method everytime it is updated.
  notify(data: T) {
    if (this.listeners.length > 0) {
      this.listeners.forEach((observer) => observer(data));
    }
  }
}
