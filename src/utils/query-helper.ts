import { FlatCache } from 'flat-cache';
import { type Result, Ok, Err, AppError, SupersededError } from "./error"

type CacheKey = string

export const cache = new FlatCache();

const queryHelper = {
  requestAbortControllers: new Map<string, AbortController>(),
  requestIdentifiers: new Map<string, number>(),
  cleanupCallbacks: new Map<string, () => void>(),

  async mutate<K extends CacheKey, Data>(key: K, fetcher: (key: K, signal: AbortSignal) => 
    Promise<Data>): Promise<Result<Data, AppError | SupersededError>> {

    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);
    const signal = abortController.signal;

    try {
      const data = await fetcher(key, signal);

      if (this.requestIdentifiers.get(key as string) === currentRequestId) {
        return new Ok(data);
      } else {
        return new Err(new SupersededError("Mutation was superseded by a new request."));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return new Err(new SupersededError("Mutation was aborted because it was superseded."));
      } else {

        return new Err(new AppError("Mutation failed", { cause: err }));
      }
    } finally {
      if (this.requestAbortControllers.get(key as string) === abortController) {
        this.requestAbortControllers.delete(key as string);
        this.requestIdentifiers.delete(key as string);
      }
    }
  },

    async query<K extends CacheKey, Data>(key: K,fetcher: (key: K, signal: AbortSignal) => 
    Promise<Data>, ): Promise<Result<Data, AppError | SupersededError>> {

    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);
    const signal = abortController.signal;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        if (attempt > 0) {
          const delay = 1000 * 2 ** (attempt - 1) + Math.random() * 500;
          await new Promise((res) => setTimeout(res, delay));
          if (signal.aborted) {
            return new Err(new SupersededError("Request superseded"));
          }
        }

        const data = await fetcher(key, signal);

        if (this.requestIdentifiers.get(key as string) === currentRequestId) {
          this.requestAbortControllers.delete(key as string);
          cache.set(key as string, data);
          return new Ok(data);
        } else {
          return new Err(new SupersededError("Request superseded"));
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (signal.aborted || lastError.name === "AbortError") {

          return new Err(new SupersededError("Request superseded"));
        }
        if (!(lastError instanceof TypeError) || attempt === 2) {
          break;
        }
      }
    }

    if (this.requestIdentifiers.get(key as string) === currentRequestId) {
      this.requestAbortControllers.delete(key as string);
    }

    return new Err(new AppError("Request failed"));
  },

    async noCacheQuery<K extends CacheKey, Data>(key: K,fetcher: (key: K, signal: AbortSignal) => 
    Promise<Data>, ): Promise<Result<Data, AppError | SupersededError>> {

    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);
    const signal = abortController.signal;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        if (attempt > 0) {
          const delay = 1000 * 2 ** (attempt - 1) + Math.random() * 500;
          await new Promise((res) => setTimeout(res, delay));
          if (signal.aborted) {
            return new Err(new SupersededError("Request superseded"));
          }
        }

        const data = await fetcher(key, signal);

        if (this.requestIdentifiers.get(key as string) === currentRequestId) {
          this.requestAbortControllers.delete(key as string);
          return new Ok(data);
        } else {
          return new Err(new SupersededError("Request superseded"));
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (signal.aborted || lastError.name === "AbortError") {

          return new Err(new SupersededError("Request superseded"));
        }
        if (!(lastError instanceof TypeError) || attempt === 2) {
          break;
        }
      }
    }

    if (this.requestIdentifiers.get(key as string) === currentRequestId) {
      this.requestAbortControllers.delete(key as string);
    }

    return new Err(new AppError("Request failed"));
  },



  revalidatListener: (revalidate: () => void) => {
    const revalidationHandler = () => {
      revalidate();
    };

    const visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        revalidationHandler();
      }
    };

    const onlineHandler = () => {
      revalidationHandler();
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);
    window.addEventListener('online', onlineHandler);
  },

  // invalidateCache(cached: object | undefined, data: object | undefined, error: Error | undefined): boolean {
  //   return (JSON.stringify(cached) !== JSON.stringify(data) &&
  //   data !== undefined && 
  //   cached !== undefined ) || 
  //   (cached === undefined && data !== error);
  // }

};

export default queryHelper;