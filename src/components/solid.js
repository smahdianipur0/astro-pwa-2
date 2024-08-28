const o = {
  context: void 0,
  registry: void 0
};

const q = (t, e) => t === e,
  m = {
    equals: q
  };

let M = z;
const p = 1,
  A = 2,
  V = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };

var l = null;
let P = null,
  i = null,
  c = null,
  a = null,
  $ = 0;

function R(t, e) {
  e = e ? Object.assign({}, m, e) : m;
  const s = {
      value: t,
      observers: null,
      observerSlots: null,
      comparator: e.equals || void 0
    },
    n = r => (typeof r == "function" && (r = r(s.value)), W(s, r));
  return [Q.bind(s), n]
}

function st(t, e, s) {
  M = at;
  const n = j(t, e, !1, p),
    r = E && I(E);
  r && (n.suspense = r), n.user = !0, a ? a.push(n) : S(n)
}

function W(t, e, s) {
  let n = t.value;
  return (!t.comparator || !t.comparator(n, e)) && (t.value = e, t.observers && t.observers.length && C(() => {
    for (let r = 0; r < t.observers.length; r += 1) {
      const u = t.observers[r],
        f = P && P.running;
      f && P.disposed.has(u), (f ? !u.tState : !u.state) && (u.pure ? c.push(u) : a.push(u), u.observers && B(u)),
        f || (u.state = p)
    }
    if (c.length > 1e6) throw c = [], new Error
  }, !1)), e
}

function S(t) {
  if (!t.fn) return;
  U(t);
  const e = $;
  ct(t, t.value, e)
}

function ct(t, e, s) {
  let n;
  const r = l,
    u = i;
  i = l = t;
  try {
    n = t.fn(e)
  } catch (f) {
    return t.pure && (t.state = p, t.owned && t.owned.forEach(U), t.owned = null), t.updatedAt = s + 1, J(f)
  } finally {
    i = u, l = r
  }(!t.updatedAt || t.updatedAt <= s) && (t.updatedAt != null && "observers" in t ? W(t, n) : t.value = n, t.updatedAt =
    s)
}

function j(t, e, s, n = p, r) {
  const u = {
    fn: t,
    state: n,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: e,
    owner: l,
    context: l ? l.context : null,
    pure: s
  };
  return l === null || l !== V && (l.owned ? l.owned.push(u) : l.owned = [u]), u
}

function B(t) {
  for (let e = 0; e < t.observers.length; e += 1) {
    const s = t.observers[e];
    s.state || (s.state = A, s.pure ? c.push(s) : a.push(s), s.observers && B(s))
  }
}

function U(t) {
  let e;
  if (t.sources)
    for (; t.sources.length;) {
      const s = t.sources.pop(),
        n = t.sourceSlots.pop(),
        r = s.observers;
      if (r && r.length) {
        const u = r.pop(),
          f = s.observerSlots.pop();
        n < r.length && (u.sourceSlots[f] = n, r[n] = u, s.observerSlots[n] = f)
      }
    }
  if (t.owned) {
    for (e = t.owned.length - 1; e >= 0; e--) U(t.owned[e]);
    t.owned = null
  }
  if (t.cleanups) {
    for (e = t.cleanups.length - 1; e >= 0; e--) t.cleanupse;
    t.cleanups = null
  }
  t.state = 0
}

function I(t) {
  return l && l.context && l.context[t.id] !== void 0 ? l.context[t.id] : t.defaultValue
}

function C(t, e) {
  if (c) return t();
  let s = !1;
  e || (c = []), a ? s = !0 : a = [], $++;
  try {
    const n = t();
    return ft(s), n
  } catch (n) {
    s || (a = null), c = null, J(n)
  }
}

function ft(t) {
  if (c && (z(c), c = null), t) return;
  const e = a;
  a = null, e.length && C(() => M(e), !1)
}

function z(t) {
  for (let e = 0; e < t.length; e++) k(t[e])
}

function at(t) {
  let e, s = 0;
  for (e = 0; e < t.length; e++) {
    const n = t[e];
    n.user ? t[s++] = n : k(n)
  }
  if (o.context) {
    if (o.count) {
      o.effects || (o.effects = []), o.effects.push(...t.slice(0, s));
      return
    } else o.effects && (t = [...o.effects, ...t], s += o.effects.length, delete o.effects);
    d()
  }
  for (e = 0; e < s; e++) k(t[e])
}

function k(t) {
  if (t.state === 0) return;
  if (t.state === A) return F(t);
  if (t.suspense && g(t.suspense.inFallback)) return t.suspense.effects.push(t);
  const e = [t];
  for (;
    (t = t.owner) && (!t.updatedAt || t.updatedAt < $);) t.state && e.push(t);
  for (let s = e.length - 1; s >= 0; s--)
    if (t = e[s], t.state === p) S(t);
    else if (t.state === A) {
    const n = c;
    c = null, C(() => F(t, e[0]), !1), c = n
  }
}

function F(t, e) {
  t.state = 0;
  for (let s = 0; s < t.sources.length; s += 1) {
    const n = t.sources[s];
    if (n.sources) {
      const r = n.state;
      r === p ? n !== e && (!n.updatedAt || n.updatedAt < $) && k(n) : r === A && F(n, e)
    }
  }
}

function d(t) {
  o.context = t
}

function _() {
  return {
    ...o.context,
    id: `${o.context.id}${o.context.count++}-`,
    count: 0
  }
}

export {
  R as createSignal, st as createEffect
};