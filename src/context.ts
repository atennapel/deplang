import { Term, showTerm, toNamed, toNameless } from './terms'
import { Name, showName, eqName } from './names';
import { impossible } from './util';

export type Elem = CVar | CDef;

const CVAR = 'CVAR';
export interface CVar {
  tag: typeof CVAR,
  name: Name;
  type: Term;
}
export const cvar = (name: Name, type: Term): CVar => ({ tag: CVAR, name, type });
export const isCVar = (term: Elem): term is CVar => term.tag === CVAR;

const CDEF = 'CDEF';
export interface CDef {
  tag: typeof CDEF,
  name: Name;
  term: Term;
}
export const cdef = (name: Name, term: Term): CDef => ({ tag: CDEF, name, term });
export const isCDef = (term: Elem): term is CDef => term.tag === CDEF;

export const showElem = (e: Elem) => {
  if(isCVar(e)) return `${showName(e.name)} : ${showTerm(e.type)}`;
  if(isCDef(e)) return `${showName(e.name)} = ${showTerm(e.term)}`;
  return impossible('showElem');
};

export const toNamelessElem = (e: Elem) => {
  if(isCVar(e)) return cvar(e.name, toNameless(e.type));
  if(isCDef(e)) return cvar(e.name, toNameless(e.term));
  return impossible('toNamelessElem');
};
export const toNamedElem = (e: Elem) => {
  if(isCVar(e)) return cvar(e.name, toNamed(e.type));
  if(isCDef(e)) return cvar(e.name, toNamed(e.term));
  return impossible('toNamedElem');
};

export type Context = Elem[];

export const showContext = (ctx: Context) => `[${ctx.map(showElem).join(', ')}]`;
export const toNamelessContext = (ctx: Context) => ctx.map(toNamelessElem);
export const toNamedContext = (ctx: Context) => ctx.map(toNamedElem);

export const append = (a: Context, b: Context) => a.concat(b);

export const find = <T>(ctx: Context, fn: (e: Elem) => T | null): T | null => {
  for(let i = 0; i < ctx.length; i++) {
    const r = fn(ctx[i]);
    if(r) return r;
  }
  return null;
}

export const findVar = (ctx: Context, x: Name): Term | null =>
  find(ctx, e => isCVar(e) && eqName(x, e.name)? e.type: null);
export const findDef = (ctx: Context, x: Name): Term | null => 
  find(ctx, e => isCDef(e) && eqName(x, e.name)? e.term: null);
