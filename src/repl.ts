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
