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
  varOpen,
  close,
  abs,
  abs_,
  pi,
  app,
  open,
  showTerm,
} from './terms';
import { impossible } from './util';
import { eqName } from './names';
import { Context, findDef } from './context';

export const reduce = (ctx: Context, t: Term): Term => {
  // console.log(`reduce ${showTerm(t)}`);
  if(isFree(t)) return findDef(ctx, t.name) || t;
  if(isBound(t)) return t;
  if(isUniverse(t)) return t;
  if(isPi(t)) {
    const x = freshIn(t.name, t.body);
    const body = close(x, reduce(ctx, varOpen(x, t.body)));
    return pi(x, t.type, body);
  }
  if(isAbs(t)) {
    const x = freshIn(t.name, t.body);
    const body = close(x, reduce(ctx, varOpen(x, t.body)));
    return t.type? abs(x, t.type, body): abs_(x, body);
  }
  if(isApp(t)) {
    const left = reduce(ctx, t.left);
    return isAbs(left)? reduce(ctx, open(t.right, left.body)): app(left, reduce(ctx, t.right));
  }
  if(isAnno(t)) return reduce(ctx, t.term);
  return impossible('reduce');
};

export const equivalent = (ctx: Context, a: Term, b: Term): boolean => equivalent_(reduce(ctx, a), reduce(ctx, b));
const equivalent_ = (a: Term, b: Term): boolean => {
  if(isFree(a) && isFree(b)) return eqName(a.name, b.name)
  if(isBound(a) && isBound(b)) return a.index === b.index
  if(isUniverse(a) && isUniverse(b)) return a.index === b.index;
  if(isPi(a) && isPi(b)) return equivalent_(a.type, b.type) && equivalent_(a.body, b.body);
  if(isAbs(a) && isAbs(b) && a.type && b.type) return equivalent_(a.type, b.type) && equivalent_(a.body, b.body);
  if(isAbs(a) && isAbs(b) && !a.type && !b.type) return equivalent_(a.body, b.body);
  if(isApp(a) && isApp(b)) return equivalent_(a.left, b.left) && equivalent_(a.right, b.right);
  if(isAnno(a) && isAnno(b)) return equivalent_(a.term, b.term) && equivalent_(a.type, b.type);
  return false;
};
