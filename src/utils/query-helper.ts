import { FlatCache } from 'flat-cache';

type CacheKey = string

export const cache = new FlatCache();

const queryHelper = {
  requestAbortControllers: new Map<string, AbortController>(),
  requestIdentifiers: new Map<string, number>(),
  cleanupCallbacks: new Map<string, () => void>(),

  async direct<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => 
    Promise<Data>): Promise<[Data | undefined, Error | undefined]> {

    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);

    try {
      const response = await fetcher(key as K, abortController.signal);
      if (currentRequestId === this.requestIdentifiers.get(key as string)) {
        return [response, undefined];
      } else {
        return [undefined, undefined];
      }
    } catch (Error) {
      return [undefined, Error] as [undefined, Error];
    } finally {
      this.requestAbortControllers.delete(key as string);
    }
  },

  async withCache<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => 
    Promise<Data>, retryCount: number = 2): Promise<[Data | undefined, Error | undefined]> {

    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);
    
    let err: Error | undefined = undefined;

    for (let attempt = 0; attempt <= retryCount; attempt++) {

      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

      try {
        const response = await fetcher(key as K, abortController.signal);
        if (currentRequestId === this.requestIdentifiers.get(key as string)) {
          cache.set(key as string, response);
          return [response, undefined];
        } else { 
          return [undefined, undefined];
        }
      } catch (Error) {
        err = Error as Error;
        if (err.message !== 'Failed to fetch' || attempt === retryCount) { break }
        
      } finally {
        this.requestAbortControllers.delete(key as string);
      } 
    }
    return [undefined, err] ;
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

  invalidateCache(cached: object | undefined, data: object | undefined, error: Error | undefined): boolean {
    return (JSON.stringify(cached) !== JSON.stringify(data) &&
    data !== undefined && 
    cached !== undefined ) || 
    (cached === undefined && data !== error);
  }

};

export default queryHelper;