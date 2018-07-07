import { str, gen, showName, fresh, freshAll } from './names';
import {
  Term,
  free,
  bound,
  universe,
  pis,
  abss,
  apps,
  anno,
  app,
  abs,
  showTerm,
  toNameless,
  toNamed,
} from './terms';
import { Context, cvar, cdef, toNamelessContext } from './context';
import { reduce } from './reduction';
import { infer } from './typechecker';
import { parse } from './parser';
import { time } from './util';

const ctx: Context = toNamelessContext([
  cdef(str('Void'), pis([[str('x'), universe(0)]], free(str('x')))),
  cvar(str('Unit'), universe(0)),
]);

const txt = `()`;
const expr = parse(txt);
console.log(showTerm(expr));
const expr_ = toNameless(expr);
console.log(showTerm(expr_));
const ty = infer(ctx, expr_);
console.log(showTerm(ty));
console.log(showTerm(toNamed(ty)));
const res = reduce(ctx, expr_);
console.log(showTerm(res));
console.log(showTerm(toNamed(res)));

/**
 * TODO:
 *  parser
 *  repl
 *  pass through contexts
 * 
 *  Void
 *  Unit
 *  Bool
 *  Nat
 *  Eq
 *  List
 *  Vector
 * 
 *  eta reduction
 *  cummulative universes
 */
