type Subscriber<Payload> = (payload: Payload) => void;
type StateEvent<K extends string, V> = { type: 'state'; name: K; value: V };
type DerivedEvent<K extends string, V> = { type: 'derived'; name: K; value: V };
type MethodEvent<K extends string, A extends unknown[]> = { type: 'method'; name: K; args: A };

type getContext<T extends readonly string[]> = {
  get<K extends T[number]>(key: K): any;
};

export function derive<T extends readonly string[], R>(deps: T,fn: (ctx: getContext<T>) => R): { 
  deps: T; 
  fn: (ctx: getContext<T>) => R } {
  return { deps, fn };
}

type DerivedDef<S, D extends DerivedDef<S, D> = any> = Record< string, {
    deps: readonly string[];
    fn: (ctx: any) => any;
  }
>

type DerivedValue<D extends DerivedDef<any>, K extends keyof D> = ReturnType<D[K]['fn']>;

type MethodsDef<S, D extends DerivedDef<S>> = {
  [K in string]: (
    this: { get<K2 extends keyof S | keyof D>(key: K2): any; set<K2 extends keyof S>(key: K2, value: S[K2]): void },
    ...args: any[]
  ) => any;
};

interface Node {
  kind: 'state' | 'derived' | 'method';
  fn: (ctx: any) => any;
  deps: Set<string>;
  dependents: Set<string>;
  subs: Set<Subscriber<any>>;
}

type EventKey<S, D extends DerivedDef<S>, M extends MethodsDef<S, D>> = Extract<keyof S | keyof D | keyof M, string>;

export type Store<S extends Record<string, any>, D extends DerivedDef<S>, M extends MethodsDef<S, D>> = {
  get<K extends keyof S | keyof D>(key: K): K extends keyof S ? S[K] : DerivedValue<D, Extract<K, keyof D>>;
} & { [K in keyof M]: (...args: Parameters<M[K]>) => ReturnType<M[K]> } & {
  on<E extends EventKey<S, D, M>>(
    events: readonly E[],
    callback: Subscriber<
      E extends keyof S ? StateEvent<E, S[E]> :
      E extends keyof D ? DerivedEvent<E, DerivedValue<D, E>> :
      E extends keyof M ? MethodEvent<E, Parameters<M[E]>> : 
      never
      >
    ): void;} & { 
    unsubscribe(): void };

export function createStore<S extends object, D extends DerivedDef<S>, M extends MethodsDef<S, D>>(
  options?: { state?: S; derived?: D; methods?: M }
): Store<S, D, M> {
  const stateObj = { ...(options?.state ?? {}) } as S;
  const derived = options?.derived ?? ({} as D);
  const methods = options?.methods ?? ({} as M);

  const lastEmittedDerivedValues = new Map<string, any>();

  const context = {
    isUpdating: false,
    pendingStateChanges: new Set<string>(),
    ephemeralDerivedCache: null as Map<string, any> | null,
    runPending() {
      if (this.pendingStateChanges.size === 0) return;
      const changed = new Set(this.pendingStateChanges);
      this.pendingStateChanges.clear();
      const affected = new Set<string>();
      changed.forEach(sk => (reachable[sk] || []).forEach(dk => affected.add(dk)));
      const toRecompute = topo.filter(dk => affected.has(dk));
      if (!toRecompute.length) return;
      this.ephemeralDerivedCache = new Map<string, any>();
      try {
        for (const dk of toRecompute) {
          const old = lastEmittedDerivedValues.get(dk);
          const val = getState(dk as keyof D);
          if (old !== val || !lastEmittedDerivedValues.has(dk)) {
            lastEmittedDerivedValues.set(dk, val);
            emit(dk, 'derived', val);
          }
        }
      } finally {
        this.ephemeralDerivedCache = null;
      }
    }
  };

  const batch = <T>(fn: () => T): T => {
    if (context.isUpdating) return fn();
    context.isUpdating = true;
    try { return fn(); }
    finally {
      context.isUpdating = false;
      context.runPending();
    }
  };

  const nodes = new Map<string, Node>();
  const allKeys = new Set<string>([
    ...Object.keys(stateObj),
    ...Object.keys(derived ),
    ...Object.keys(methods)
  ]);

  for (const key of allKeys) {
    const isDerived = key in derived ;
    const isMethod = key in methods;
    const deps = isDerived
      ? new Set((derived [key as keyof D]!.deps as string[]).map(String))
      : new Set<string>();
    nodes.set(key, {
      kind: isMethod ? 'method' : isDerived ? 'derived' : 'state',
      fn: isDerived ? (derived [key as keyof D]!.fn as any) : () => {},
      deps,
      dependents: new Set(),
      subs: new Set()
    });
  }

  for (const [k, node] of nodes) {
    for (const dep of node.deps) nodes.get(dep)?.dependents.add(k);
  }

  const { topo, reachable } = (() => {
    const indegree = new Map<string, number>();
    for (const k of Object.keys(derived)) indegree.set(k, 0);
    for (const k of indegree.keys()) {
      for (const d of nodes.get(k)!.deps) if (indegree.has(d)) indegree.set(k, indegree.get(k)! + 1);
    }
    const queue: string[] = [];
    indegree.forEach((d, k) => d === 0 && queue.push(k));
    const sorted: string[] = [];
    while (queue.length) {
      const k = queue.shift()!;
      sorted.push(k);
      nodes.get(k)!.dependents.forEach(c => {
        if (!indegree.has(c)) return;
        indegree.set(c, indegree.get(c)! - 1);
        if (indegree.get(c)! === 0) queue.push(c);
      });
    }
    if (sorted.length !== indegree.size) {
      const cycle = Array.from(indegree.keys()).filter(k => !sorted.includes(k));
      throw new Error(`Circular dependency: ${cycle.join(', ')}`);
    }
    const R: Record<string, string[]> = {};
    for (const sk of Object.keys(stateObj)) {
      const seen = new Set<string>();
      const stack = [...nodes.get(sk)!.dependents];
      while (stack.length) {
        const d = stack.pop()!;
        if (!seen.has(d) && indegree.has(d)) {
          seen.add(d);
          stack.push(...nodes.get(d)!.dependents);
        }
      }
      R[sk] = sorted.filter(d => seen.has(d));
    }
    return { topo: sorted, reachable: R };
  })();

  function emit(name: string, type: Node["kind"], payload: unknown) {
    nodes.get(name)?.subs.forEach((cb) => {
      try {
        cb({ type, name, ...(type === "method" ? { args: payload } : { value: payload }) });
      } catch {}
    });
  }
  
  const computeRaw = (key: string) => {
    const node = nodes.get(key)!;
    return node.fn({get: getState});
  };

  function setState<K extends keyof S>(k: K, v: S[K]) {
    batch(() => {
      if (stateObj[k] !== v) {
        stateObj[k] = v;
        emit(String(k), 'state', v);
        context.pendingStateChanges.add(String(k));
      }
    });
  }

  function getState<K extends keyof S | keyof D>(key: K) {
    const k = String(key);
    const node = nodes.get(k);
    if (node?.kind === 'derived') {
      if (context.ephemeralDerivedCache?.has(k)) return context.ephemeralDerivedCache.get(k);
      const val = computeRaw(k);
      context.ephemeralDerivedCache?.set(k, val);
      return val;
    }
    return stateObj[key as keyof S];
  }

  const api = { get: getState, set: setState };
  const processed: Record<string, Function> = {};
  for (const name of Object.keys(methods)) {
    processed[name] = (...args: any[]) => batch(() => {
      const res = (methods as any)[name].apply(api, args);
      emit(name, 'method', args);
      return res;
    });
  }

  function on<E extends EventKey<S, D, M>>(events: readonly E[], cb: Subscriber<any>): void {
    Array.from(new Set(events.map(String))).forEach(e => {
      const node = nodes.get(e);
      if (node) node.subs.add(cb);
    });
  }

  function unsubscribe() { nodes.forEach(node => node.subs.clear()) }

  return { get: getState, ...processed, on, unsubscribe } as Store<S, D, M>;
  
}