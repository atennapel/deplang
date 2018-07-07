import { Name, showName, eqName, fresh, freshAll } from './names';
import { impossible } from './util';

export type Term = Free | Bound | Universe | Pi | Abs | App | Anno;

const FREE = 'FREE';
export interface Free {
  tag: typeof FREE,
  name: Name;
}
export const free = (name: Name): Free => ({ tag: FREE, name });
export const isFree = (term: Term): term is Free => term.tag === FREE;

const BOUND = 'BOUND';
export interface Bound {
  tag: typeof BOUND,
  index: number;
}
export const bound = (index: number): Bound => ({ tag: BOUND, index });
export const isBound = (term: Term): term is Bound => term.tag === BOUND;

const UNIVERSE = 'UNIVERSE';
export interface Universe {
  tag: typeof UNIVERSE,
  index: number;
}
export const universe = (index: number): Universe => ({ tag: UNIVERSE, index });
export const isUniverse = (term: Term): term is Universe => term.tag === UNIVERSE;

const PI = 'PI';
export interface Pi {
  tag: typeof PI,
  name: Name;
  type: Term;
  body: Term;
}
export const pi = (name: Name, type: Term, body: Term): Pi => ({ tag: PI, name, type, body });
export const isPi = (term: Term): term is Pi => term.tag === PI;
export const pis = (ns: [Name, Term][], body: Term): Term =>
  ns.reduceRight((b, [n, t]) => pi(n, t, b), body);

const ABS = 'ABS';
export interface Abs {
  tag: typeof ABS,
  name: Name;
  type: Term | null;
  body: Term;
}
export const abs = (name: Name, type: Term | null, body: Term): Abs => ({ tag: ABS, name, type, body });
export const abs_ = (name: Name, body: Term): Abs => abs(name, null, body);
export const isAbs = (term: Term): term is Abs => term.tag === ABS;
export const abss = (ns: (Name | [Name, Term])[], body: Term): Term =>
  ns.reduceRight((b, x) => Array.isArray(x)? abs(x[0], x[1], b): abs_(x, b), body);

const APP = 'APP';
export interface App {
  tag: typeof APP,
  left: Term;
  right: Term;
}
export const app = (left: Term, right: Term): App => ({ tag: APP, left, right });
export const isApp = (term: Term): term is App => term.tag === APP;
export const apps = (ts: Term[]): Term => ts.reduce(app);

const ANNO = 'ANNO';
export interface Anno {
  tag: typeof ANNO,
  term: Term;
  type: Term;
}
export const anno = (term: Term, type: Term): Anno => ({ tag: ANNO, term, type });
export const isAnno = (term: Term): term is Anno => term.tag === ANNO;

export const flattenPi = (t: Pi): { args: [Name, Term][], body: Term } => {
  const r: [Name, Term][] = [];
  let c: Term = t;
  while(isPi(c)) {
    r.push([c.name, c.type] as [Name, Term]);
    c = c.body;
  }
  return { args: r, body: c };
};
export const flattenAbs = (t: Abs): { args: [Name, Term | null][], body: Term } => {
  const r: [Name, Term][] = [];
  let c: Term = t;
  while(isAbs(c)) {
    r.push([c.name, c.type] as [Name, Term]);
    c = c.body;
  }
  return { args: r, body: c };
};
export const flattenApp = (t: App): Term[] => {
  const r: Term[] = [];
  let c: Term = t;
  while(isApp(c)) {
    r.push(c.right);
    c = c.left;
  }
  r.push(c);
  return r.reverse();
};

const ARROW = ' -> ';
export const showTerm = (t: Term): string => {
  if(isFree(t)) return showName(t.name);
  if(isBound(t)) return `#${t.index}`;
  if(isUniverse(t)) return `Type${t.index || ''}`;
  if(isPi(t)) {
    const f = flattenPi(t);
    return `/${f.args.map(([x, t]) => `(${showName(x)} : ${showTerm(t)})`).join(' ')}${ARROW}${showTerm(f.body)}`;
  }
  if(isAbs(t)) {
    const f = flattenAbs(t);
    return `\\${f.args.map(([x, t]) => t? `(${showName(x)} : ${showTerm(t)})`: showName(x)).join(' ')}${ARROW}${showTerm(f.body)}`;
  }
  if(isApp(t)) {
    const f = flattenApp(t);
    return f.map(t => isPi(t) || isAbs(t) || isApp(t)? `(${showTerm(t)})`: showTerm(t)).join(' ');
  }
  if(isAnno(t)) return `(${showTerm(t.term)} : ${showTerm(t.type)})`;
  return impossible('showTerm');
};

export const freeVars = (t: Term): Name[] => {
  if(isFree(t)) return [t.name];
  if(isBound(t)) return [];
  if(isUniverse(t)) return [];
  if(isPi(t)) return freeVars(t.type).concat(freeVars(t.body));
  if(isAbs(t)) return (t.type? freeVars(t.type): []).concat(freeVars(t.body));
  if(isApp(t)) return freeVars(t.left).concat(freeVars(t.right));
  if(isAnno(t)) return freeVars(t.term).concat(freeVars(t.type));
  return impossible('freeVars');
};

export const freshIn = (x: Name, t: Term): Name => fresh(freeVars(t), x);
export const freshIn2 = (x: Name, t: Term, u: Term): Name => fresh(freeVars(t).concat(freeVars(u)), x);

export const open = (u: Term, t: Term, k = 0): Term => {
  if(isFree(t)) return t;
  if(isBound(t)) return k === t.index? u: t;
  if(isUniverse(t)) return t;
  if(isPi(t)) return pi(t.name, open(u, t.type, k), open(u, t.body, k + 1))
  if(isAbs(t)) return abs(t.name, t.type && open(u, t.type, k), open(u, t.body, k + 1));
  if(isApp(t)) return app(open(u, t.left, k), open(u, t.right, k));
  if(isAnno(t)) return app(open(u, t.term, k), open(u, t.type, k));
  return impossible('open');
};
export const varOpen = (n: Name, t: Term) => open(free(n), t);

export const close = (u: Name, t: Term, k = 0): Term => {
  if(isFree(t)) return eqName(u, t.name)? bound(k): t;
  if(isBound(t)) return t;
  if(isUniverse(t)) return t;
  if(isPi(t)) return pi(t.name, close(u, t.type, k), close(u, t.body, k + 1))
  if(isAbs(t)) return abs(t.name, t.type && close(u, t.type, k), close(u, t.body, k + 1));
  if(isApp(t)) return app(close(u, t.left, k), close(u, t.right, k));
  if(isAnno(t)) return app(close(u, t.term, k), close(u, t.type, k));
  return impossible('close');
};
export const subst = (x: Name, u: Term, t: Term) => open(u, close(x, t));

export const isLocallyClosed = (t: Term, k = 0): boolean => {
  if(isFree(t)) return true;
  if(isBound(t)) return t.index < k;
  if(isUniverse(t)) return true;
  if(isPi(t)) return isLocallyClosed(t.type, k) && isLocallyClosed(t.body, k + 1);
  if(isAbs(t)) return (t.type? isLocallyClosed(t.type, k): true) && isLocallyClosed(t.body, k + 1);
  if(isApp(t)) return isLocallyClosed(t.left, k) && isLocallyClosed(t.right, k);
  if(isAnno(t)) return isLocallyClosed(t.term, k) && isLocallyClosed(t.type, k);
  return impossible('isLocallyClosed');
};
export const isClosed = (t: Term): boolean => freeVars(t).length === 0;

export const toNameless = (t: Term): Term => {
  if(isFree(t)) return t;
  if(isBound(t)) return t;
  if(isUniverse(t)) return t;
  if(isPi(t)) return pi(t.name, toNameless(t.type), toNameless(close(t.name, t.body)));
  if(isAbs(t)) return abs(t.name, t.type && toNameless(t.type), toNameless(close(t.name, t.body)));
  if(isApp(t)) return app(toNameless(t.left), toNameless(t.right));
  if(isAnno(t)) return app(toNameless(t.term), toNameless(t.type));
  return impossible('toNameless');
};

export const toNamed = (t: Term): Term => {
  if(isFree(t)) return t;
  if(isBound(t)) throw new Error('bound variable in toNamed');
  if(isUniverse(t)) return t;
  if(isPi(t)) return pi(t.name, toNamed(t.type), toNamed(varOpen(t.name, t.body)));
  if(isAbs(t)) return abs(t.name, t.type && toNamed(t.type), toNamed(varOpen(t.name, t.body)));
  if(isApp(t)) return app(toNamed(t.left), toNamed(t.right));
  if(isAnno(t)) return app(toNamed(t.term), toNamed(t.type));
  return impossible('toNamed');
};
