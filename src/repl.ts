import { parse } from './parser';
import { infer } from './typechecker';
import { Context, cvar, cdef, toNamelessContext } from './context';
import {
  Term,
  universe,
  free,
  pis,
  showTerm,
  toNameless,
  toNamed,
} from './terms';
import {
  Name,
  str,
} from './names';
import { reduce } from './reduction';

const ctx: Context = toNamelessContext([
  cvar(str('Void'), universe(0)),
  cvar(str('void'), pis([[str('t'), universe(0)], [str('x'), free(str('Void'))]], free(str('t')))),

  cvar(str('Unit'), universe(0)),
  cvar(str('unit'), free(str('Unit'))),

  cvar(str('Bool'), universe(0)),
  cvar(str('true'), free(str('Bool'))),
  cvar(str('false'), free(str('Bool'))),
  cvar(str('if'), pis([
    [str('t'), universe(0)],
    [str('c'), free(str('Bool'))],
    [str('a'), free(str('t'))],
    [str('b'), free(str('t'))]
  ], free(str('t')))),
]);

export default function run(s: string, cb: (output: string, err?: boolean) => void): void {
  if(s === ':help') return cb('WIP');
  try {
    console.log(s);
    const t = toNameless(parse(s));
    console.log(showTerm(t));
    const ty = infer(ctx, t);
    console.log(showTerm(ty));
    const r = reduce(ctx, t);
    console.log(showTerm(r));
    return cb(`${showTerm(toNamed(r))} : ${showTerm(toNamed(ty))}`);
  } catch(err) {
    return cb(`${err}`, true);
  }
}
