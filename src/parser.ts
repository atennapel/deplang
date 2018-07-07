import {
  Term,
  free,
  universe,
  pis,
  abss,
  app,
  apps,
  anno,
} from './terms';
import {
  Name,
  str,
} from './names';

function matchingBracket(c: string) {
  if(c === '(') return ')';
  if(c === ')') return '(';
  if(c === '{') return '}';
  if(c === '}') return '{';
  if(c === '[') return ']';
  if(c === ']') return '[';
  return '';
}

type Ret = Token | Paren;
interface Token {
  tag: 'token';
  val: string;
}
interface Paren {
  tag: 'paren';
  type: string;
  val: Ret[];
}
const token = (val: string): Token => ({ tag: 'token', val });
const paren = (val: Ret[], type: string): Paren => ({ tag: 'paren', type, val });

function showRet(x: Ret): string {
  return x.tag === 'token'? x.val: x.tag === 'paren'? `${x.type}${x.val.map(showRet).join(' ')}${matchingBracket(x.type)}`: '';
}
function showRets(x: Ret[]): string {
  return `[${x.map(showRet).join(' ')}]`;
}

function tokenize(s: string): Ret[] {
  const START = 0, NAME = 1, STR = 2, NUM = 3;
  let state = START;
  let r: Ret[] = [], p: Ret[][] = [], b: string[] = [];
  let t = '';
  let escape = false;
  for(let i = 0; i <= s.length; i++) {
    const c = s[i] || ' ';
    if(state === START) {
      if(/[a-z]/i.test(c)) t += c, state = NAME;
      else if(/[0-9]/.test(c)) t += c, state = NUM;
      else if(c === '"') state = STR;
      else if(c === '-' && s[i+1] === '>') r.push(token('->')), i++;
      else if(c === '$') r.push(token('$'));
      else if(c === ':') r.push(token(':'));
      else if(c === '\\') r.push(token('\\'));
      else if(c === '/') r.push(token('/'));
      else if(c === '(' || c === '{' || c === '[') b.push(c), p.push(r), r = [];
      else if(c === ')' || c === '}' || c === ']') {
        if(b.length === 0) throw new SyntaxError(`unmatched bracket: ${c}`);
        const br = b.pop() as string;
        if(matchingBracket(br) !== c) throw new SyntaxError(`unmatched bracket: ${br} and ${c}`);
        const a: Ret[] = p.pop() as Ret[];
        a.push(paren(r, br));
        r = a;
      } else if(/\s+/.test(c)) continue;
      else throw new SyntaxError(`invalid char: ${c}`);
    } else if(state === NAME) {
      if(!/[a-z0-9]/i.test(c)) r.push(token(t)), t = '', i--, state = START;
      else t += c;
    } else if(state === NUM) {
      if(!/[0-9\.]/i.test(c)) r.push(token(t)), t = '', i--, state = START;
      else t += c;
    } else if(state === STR) {
      if(escape) t += c, escape = false;
      else if(c === '\\') escape = true; 
      else if(c === '"') r.push(token(`"${t}`)), t = '', state = START;
      else t += c;
    }
  }
  if(state !== START) throw new SyntaxError(`invalid parsing state: ${state}`);
  return r;
}

export function parse(s: string): Term {
  return terms(tokenize(s));
}

function isToken(x: Ret, n: string): boolean {
  return x.tag === 'token' && x.val === n;
}
function containsToken(x: Ret[], n: string): boolean {
  return x.filter(x => x.tag === 'token').map(x => x.val as string).indexOf(n) >= 0;
}
function splitOn(x: Ret[], f: (x:Ret) => boolean) {
  const r: Ret[][] = [];
  let c: Ret[] = [];
  for(let i = 0; i < x.length; i++) {
    if(f(x[i])) {
      r.push(c);
      c = [];
    } else c.push(x[i]);
  }
  r.push(c);
  return r;
}
function comesBefore(x: Ret[], a: string, b: string) {
  for(let i = 0; i < x.length; i++) {
    if(isToken(x[i], a))
      return true;
    else if(isToken(x[i], b))
      return false;
  }
  return false;
}

function terms(x: Ret[], stack: Term | null = null, mode: string | null = null): Term {
  // console.log(`exprs ${showRets(x)} ${stack} ${mode}`);
  if(x.length === 0) {
    if(mode) throw new SyntaxError(`invalid use of ${mode}`);
    return stack || free(str('Unit'));
  }
  if(containsToken(x, ':')) {
    const xs = splitOn(x, t => isToken(t, ':'));
    if(stack || mode || xs.length !== 2 || xs[0].length === 0 || xs[1].length === 0)
      throw new SyntaxError('invalid use of :');
    return anno(terms(xs[0]), terms(xs[1]));
  }
  const head = x[0];
  if(isToken(head, ':')) throw new SyntaxError('invalid use of :');
  if(isToken(head, '$')) {
    if(mode) throw new SyntaxError('invalid use of $');
    if(!stack) return x.length < 2? free(str('app')): apps([free(str('flip')), free(str('app')), terms(x.slice(1))]);
    if(x.length < 2) throw new SyntaxError('invalid use of $');
    return app(stack as Term, terms(x.slice(1)));
  }
  if(isToken(head, '\\')) {
    if(mode) throw new SyntaxError(`\\ after ${mode}`);
    const args: (Name | [Name, Term])[] = [];
    let found = -1;
    for(let i = 1; i < x.length; i++) {
      const c = x[i];
      if(isToken(c, '\\')) throw new SyntaxError('invalid use of \\');
      else if(isToken(c, '->')) {
        found = i;
        break;
      } else if(c.tag === 'token') args.push(str(c.val));
      else if(c.tag === 'paren' && c.type !== '(') throw new SyntaxError(`unexpected bracket in \\ ${c.type}`);
      else if(c.tag === 'paren' && c.val.length === 0) args.push([str('_'), term(c)]);
      else if(c.tag === 'paren' && containsToken(c.val, ':')) {
        const s = splitOn(c.val, x => isToken(x, ':'));
        if(s.length !== 2) throw new SyntaxError('nested anno arg :');
        const l = s[0].map(x => {
          if(x.tag === 'token') return x.val;
          throw new SyntaxError(`invalid arg: ${x}`);
        });
        const r = terms(s[1]);
        l.forEach(n => args.push([str(n), r]));
      } else throw new SyntaxError(`invalid arg: ${c}`);
    }
    if(found < 0) throw new SyntaxError(`missing -> after \\`);
    const rest = x.slice(found + 1);
    if(args.length === 0) throw new SyntaxError('\\ without args');
    if(rest.length === 0) throw new SyntaxError(`missing body in function`);
    const abs = abss(args, terms(rest));
    return stack? app(stack, abs): abs;
  }
  if(isToken(head, '/')) {
    if(mode) throw new SyntaxError(`/ after ${mode}`);
    const args: [Name, Term][] = [];
    let found = -1;
    for(let i = 1; i < x.length; i++) {
      const c = x[i];
      if(isToken(c, '/')) throw new SyntaxError('invalid use of /');
      else if(isToken(c, '->')) {
        found = i;
        break;
      } else if(c.tag === 'paren' && c.type !== '(') throw new SyntaxError(`unexpected bracket in \\ ${c.type}`);
      else if(c.tag === 'paren' && c.val.length === 0) args.push([str('_'), term(c)]);
      else if(c.tag === 'paren' && containsToken(c.val, ':')) {
        const s = splitOn(c.val, x => isToken(x, ':'));
        if(s.length !== 2) throw new SyntaxError('nested anno arg :');
        const l = s[0].map(x => {
          if(x.tag === 'token') return x.val;
          throw new SyntaxError(`invalid arg: ${x}`);
        });
        const r = terms(s[1]);
        l.forEach(n => args.push([str(n), r]));
      } else throw new SyntaxError(`invalid arg: ${c}`);
    }
    if(found < 0) throw new SyntaxError(`missing -> after \\`);
    const rest = x.slice(found + 1);
    if(args.length === 0) throw new SyntaxError('\\ without args');
    if(rest.length === 0) throw new SyntaxError(`missing body in function`);
    const abs = pis(args, terms(rest));
    return stack? app(stack, abs): abs;
  }
  if(stack) {
    return terms(x.slice(1), app(stack, term(head)), mode);
  } else {
    return terms(x.slice(1), term(head), mode);
  }
}

function term(x: Ret): Term {
  if(x.tag === 'token') {
    if(x.val === '$') return free(str('app'));
    if(x.val.startsWith('Type')) {
      if(x.val.length === 4) return universe(0);
      const i = +x.val.slice(4);
      if(isNaN(i)) return free(str(x.val));
      return universe(i < 0? 0: Math.floor(i));
    }
    return free(str(x.val));
  }
  if(x.type !== '(') throw new SyntaxError(`invalid bracket ${x.type}`);
  return terms(x.val);
}
