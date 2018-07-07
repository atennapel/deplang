import {
  Term,
  isFree,
  isBound,
  isUniverse,
  isPi,
  isAbs,
  isApp,
  isAnno,
  freshIn,
  freshIn2,
  varOpen,
  close,
  abs,
  abs_,
  pi,
  app,
  open,
  showTerm,
  isLocallyClosed,
  universe,
} from './terms';
import {
  cvar,
  Context,
  append,
  findVar,
  findDef,
  showContext,
} from './context';
import { showName } from './names';
import { reduce, equivalent } from './reduction';
import { impossible } from './util';

const err = (msg: string) => { throw new TypeError(msg) };

const synthUniverse = (ctx: Context, t: Term): number => {
  const u = reduce(ctx, synth(ctx, t));
  if(isUniverse(u)) return u.index;
  return err(`universe expected but got ${showTerm(u)} in ${showContext(ctx)}`);
};

const synth = (ctx: Context, t: Term): Term => {
  console.log(`synth ${showTerm(t)} in ${showContext(ctx)}`);
  if(!isLocallyClosed(t)) return err(`not locally closed ${showTerm(t)}`);
  if(isFree(t)) {
    const r = findVar(ctx, t.name);
    if(r) return r;
    const rr = findDef(ctx, t.name);
    if(rr) {
      return synth(ctx, rr);
    }
    return err(`undefined var ${showName(t.name)}`);
  }
  if(isBound(t)) return err(`bound in synth ${t.index}`);
  if(isUniverse(t)) return universe(t.index + 1);
  if(isPi(t)) {
    const k1 = synthUniverse(ctx, t.type);
    const x = freshIn(t.name, t.body);
    const k2 = synthUniverse(append(ctx, [cvar(x, reduce(ctx, t.type))]), varOpen(x, t.body));
    return universe(Math.max(k1, k2));
  }
  if(isAbs(t) && t.type) {
    synthUniverse(ctx, t.type);
    const ty = reduce(ctx, t.type);
    const x = freshIn(t.name, t.body);
    const tt = synth(append(ctx, [cvar(x, ty)]), varOpen(x, t.body));
    return pi(x, ty, close(x, tt));
  }
  if(isApp(t)) {
    const ty = reduce(ctx, synth(ctx, t.left));
    if(isPi(ty)) {
      check(ctx, t.right, ty.type);
      return reduce(ctx, open(t.right, ty.body));
    }
    return err(`lhs of app not a pi type: ${showTerm(ty)} in ${showTerm(ty)} in ${showContext(ctx)}`);
  }
  if(isAnno(t)) {
    check(ctx, t.type, universe(0));
    const ty = reduce(ctx, t.type);
    check(ctx, t.term, ty);
    return ty;
  }
  return err(`cannot synth ${showTerm(t)} in ${showContext(ctx)}`);
}

const check = (ctx: Context, t: Term, u: Term): null => {
  console.log(`check ${showTerm(t)} : ${showTerm(u)} in ${showContext(ctx)}`);
  if(!isLocallyClosed(t)) return err(`not locally closed ${showTerm(t)}`);
  if(!isLocallyClosed(u)) return err(`not locally closed ${showTerm(u)}`);
  const a = reduce(ctx, t);
  const b = reduce(ctx, u);
  if(isAbs(t) && !t.type && isPi(u)) {
    const x = freshIn2(t.name, t.body, u.body);
    return check(append(ctx, [cvar(x, u.type)]), varOpen(x, t.body), varOpen(x, u.body));
  }
  const tt = synth(ctx, t);
  if(equivalent(ctx, tt, u)) return null;
  return err(`check failed ${showTerm(t)} (${showTerm(tt)} ~ ${showTerm(u)}) in ${showContext(ctx)}`);
}

export const infer = (ctx: Context, t: Term): Term => synth(ctx, t);
