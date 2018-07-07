import { parse } from './parser';
import { infer } from './typechecker';
import { Context, cvar, cdef, toNamelessContext } from './context';
import {
  Term,
  universe,
  free,
  showTerm,
  toNameless,
  toNamed,
} from './terms';
import {
  str,
} from './names';
import { reduce } from './reduction';

const ctx: Context = toNamelessContext([
  cvar(str('Unit'), universe(0)),
  cvar(str('unit'), free(str('Unit'))),
]);

export default function run(s: string, cb: (output: string, err?: boolean) => void): void {
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
