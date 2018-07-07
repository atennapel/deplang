(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terms_1 = require("./terms");
const names_1 = require("./names");
const util_1 = require("./util");
const CVAR = 'CVAR';
exports.cvar = (name, type) => ({ tag: CVAR, name, type });
exports.isCVar = (term) => term.tag === CVAR;
const CDEF = 'CDEF';
exports.cdef = (name, term) => ({ tag: CDEF, name, term });
exports.isCDef = (term) => term.tag === CDEF;
exports.showElem = (e) => {
    if (exports.isCVar(e))
        return `${names_1.showName(e.name)} : ${terms_1.showTerm(e.type)}`;
    if (exports.isCDef(e))
        return `${names_1.showName(e.name)} = ${terms_1.showTerm(e.term)}`;
    return util_1.impossible('showElem');
};
exports.toNamelessElem = (e) => {
    if (exports.isCVar(e))
        return exports.cvar(e.name, terms_1.toNameless(e.type));
    if (exports.isCDef(e))
        return exports.cvar(e.name, terms_1.toNameless(e.term));
    return util_1.impossible('toNamelessElem');
};
exports.toNamedElem = (e) => {
    if (exports.isCVar(e))
        return exports.cvar(e.name, terms_1.toNamed(e.type));
    if (exports.isCDef(e))
        return exports.cvar(e.name, terms_1.toNamed(e.term));
    return util_1.impossible('toNamedElem');
};
exports.showContext = (ctx) => `[${ctx.map(exports.showElem).join(', ')}]`;
exports.toNamelessContext = (ctx) => ctx.map(exports.toNamelessElem);
exports.toNamedContext = (ctx) => ctx.map(exports.toNamedElem);
exports.append = (a, b) => a.concat(b);
exports.find = (ctx, fn) => {
    for (let i = 0; i < ctx.length; i++) {
        const r = fn(ctx[i]);
        if (r)
            return r;
    }
    return null;
};
exports.findVar = (ctx, x) => exports.find(ctx, e => exports.isCVar(e) && names_1.eqName(x, e.name) ? e.type : null);
exports.findDef = (ctx, x) => exports.find(ctx, e => exports.isCDef(e) && names_1.eqName(x, e.name) ? e.term : null);

},{"./names":2,"./terms":6,"./util":8}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const STR = 'STR';
exports.str = (name) => ({ tag: STR, name });
exports.isStr = (name) => name.tag === STR;
const GEN = 'GEN';
exports.gen = (name, index) => ({ tag: GEN, name, index });
exports.isGen = (name) => name.tag === GEN;
exports.showName = (x) => {
    if (exports.isStr(x))
        return x.name;
    if (exports.isGen(x))
        return `${x.name}\$${x.index}`;
    return util_1.impossible('strName');
};
exports.eqName = (a, b) => {
    if (exports.isStr(a) && exports.isStr(b))
        return a.name === b.name;
    if (exports.isGen(a) && exports.isGen(b))
        return a.name === b.name && a.index === b.index;
    return false;
};
const incName = (x) => {
    if (exports.isStr(x))
        return exports.gen(x.name, 0);
    if (exports.isGen(x))
        return exports.gen(x.name, x.index + 1);
    return util_1.impossible('incName');
};
exports.fresh = (ns, x) => {
    let c = x;
    for (let i = 0; i < ns.length; i++) {
        if (exports.eqName(c, ns[i])) {
            c = incName(c);
            i = -1;
        }
    }
    return c;
};
exports.freshAll = (ns, xs) => {
    const r = [];
    let c = ns.slice(0);
    for (let i = 0; i < xs.length; i++) {
        const n = exports.fresh(c, xs[i]);
        r.push(n);
        c.push(n);
    }
    return r;
};

},{"./util":8}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terms_1 = require("./terms");
const names_1 = require("./names");
function matchingBracket(c) {
    if (c === '(')
        return ')';
    if (c === ')')
        return '(';
    if (c === '{')
        return '}';
    if (c === '}')
        return '{';
    if (c === '[')
        return ']';
    if (c === ']')
        return '[';
    return '';
}
const token = (val) => ({ tag: 'token', val });
const paren = (val, type) => ({ tag: 'paren', type, val });
function showRet(x) {
    return x.tag === 'token' ? x.val : x.tag === 'paren' ? `${x.type}${x.val.map(showRet).join(' ')}${matchingBracket(x.type)}` : '';
}
function showRets(x) {
    return `[${x.map(showRet).join(' ')}]`;
}
function tokenize(s) {
    const START = 0, NAME = 1, STR = 2, NUM = 3;
    let state = START;
    let r = [], p = [], b = [];
    let t = '';
    let escape = false;
    for (let i = 0; i <= s.length; i++) {
        const c = s[i] || ' ';
        if (state === START) {
            if (/[a-z]/i.test(c))
                t += c, state = NAME;
            else if (/[0-9]/.test(c))
                t += c, state = NUM;
            else if (c === '"')
                state = STR;
            else if (c === '-' && s[i + 1] === '>')
                r.push(token('->')), i++;
            else if (c === '$')
                r.push(token('$'));
            else if (c === ':')
                r.push(token(':'));
            else if (c === '\\')
                r.push(token('\\'));
            else if (c === '/')
                r.push(token('/'));
            else if (c === '(' || c === '{' || c === '[')
                b.push(c), p.push(r), r = [];
            else if (c === ')' || c === '}' || c === ']') {
                if (b.length === 0)
                    throw new SyntaxError(`unmatched bracket: ${c}`);
                const br = b.pop();
                if (matchingBracket(br) !== c)
                    throw new SyntaxError(`unmatched bracket: ${br} and ${c}`);
                const a = p.pop();
                a.push(paren(r, br));
                r = a;
            }
            else if (/\s+/.test(c))
                continue;
            else
                throw new SyntaxError(`invalid char: ${c}`);
        }
        else if (state === NAME) {
            if (!/[a-z0-9]/i.test(c))
                r.push(token(t)), t = '', i--, state = START;
            else
                t += c;
        }
        else if (state === NUM) {
            if (!/[0-9\.]/i.test(c))
                r.push(token(t)), t = '', i--, state = START;
            else
                t += c;
        }
        else if (state === STR) {
            if (escape)
                t += c, escape = false;
            else if (c === '\\')
                escape = true;
            else if (c === '"')
                r.push(token(`"${t}`)), t = '', state = START;
            else
                t += c;
        }
    }
    if (state !== START)
        throw new SyntaxError(`invalid parsing state: ${state}`);
    return r;
}
function parse(s) {
    return terms(tokenize(s));
}
exports.parse = parse;
function isToken(x, n) {
    return x.tag === 'token' && x.val === n;
}
function containsToken(x, n) {
    return x.filter(x => x.tag === 'token').map(x => x.val).indexOf(n) >= 0;
}
function splitOn(x, f) {
    const r = [];
    let c = [];
    for (let i = 0; i < x.length; i++) {
        if (f(x[i])) {
            r.push(c);
            c = [];
        }
        else
            c.push(x[i]);
    }
    r.push(c);
    return r;
}
function comesBefore(x, a, b) {
    for (let i = 0; i < x.length; i++) {
        if (isToken(x[i], a))
            return true;
        else if (isToken(x[i], b))
            return false;
    }
    return false;
}
function terms(x, stack = null, mode = null) {
    // console.log(`exprs ${showRets(x)} ${stack} ${mode}`);
    if (x.length === 0) {
        if (mode)
            throw new SyntaxError(`invalid use of ${mode}`);
        return stack || terms_1.free(names_1.str('Unit'));
    }
    if (containsToken(x, ':')) {
        const xs = splitOn(x, t => isToken(t, ':'));
        if (stack || mode || xs.length !== 2 || xs[0].length === 0 || xs[1].length === 0)
            throw new SyntaxError('invalid use of :');
        return terms_1.anno(terms(xs[0]), terms(xs[1]));
    }
    const head = x[0];
    if (isToken(head, ':'))
        throw new SyntaxError('invalid use of :');
    if (isToken(head, '$')) {
        if (mode)
            throw new SyntaxError('invalid use of $');
        if (!stack)
            return x.length < 2 ? terms_1.free(names_1.str('app')) : terms_1.apps([terms_1.free(names_1.str('flip')), terms_1.free(names_1.str('app')), terms(x.slice(1))]);
        if (x.length < 2)
            throw new SyntaxError('invalid use of $');
        return terms_1.app(stack, terms(x.slice(1)));
    }
    if (isToken(head, '\\')) {
        if (mode)
            throw new SyntaxError(`\\ after ${mode}`);
        const args = [];
        let found = -1;
        for (let i = 1; i < x.length; i++) {
            const c = x[i];
            if (isToken(c, '\\'))
                throw new SyntaxError('invalid use of \\');
            else if (isToken(c, '->')) {
                found = i;
                break;
            }
            else if (c.tag === 'token')
                args.push(names_1.str(c.val));
            else if (c.tag === 'paren' && c.type !== '(')
                throw new SyntaxError(`unexpected bracket in \\ ${c.type}`);
            else if (c.tag === 'paren' && c.val.length === 0)
                args.push([names_1.str('_'), term(c)]);
            else if (c.tag === 'paren' && containsToken(c.val, ':')) {
                const s = splitOn(c.val, x => isToken(x, ':'));
                if (s.length !== 2)
                    throw new SyntaxError('nested anno arg :');
                const l = s[0].map(x => {
                    if (x.tag === 'token')
                        return x.val;
                    throw new SyntaxError(`invalid arg: ${x}`);
                });
                const r = terms(s[1]);
                l.forEach(n => args.push([names_1.str(n), r]));
            }
            else
                throw new SyntaxError(`invalid arg: ${c}`);
        }
        if (found < 0)
            throw new SyntaxError(`missing -> after \\`);
        const rest = x.slice(found + 1);
        if (args.length === 0)
            throw new SyntaxError('\\ without args');
        if (rest.length === 0)
            throw new SyntaxError(`missing body in function`);
        const abs = terms_1.abss(args, terms(rest));
        return stack ? terms_1.app(stack, abs) : abs;
    }
    if (isToken(head, '/')) {
        if (mode)
            throw new SyntaxError(`/ after ${mode}`);
        const args = [];
        let found = -1;
        for (let i = 1; i < x.length; i++) {
            const c = x[i];
            if (isToken(c, '/'))
                throw new SyntaxError('invalid use of /');
            else if (isToken(c, '->')) {
                found = i;
                break;
            }
            else if (c.tag === 'paren' && c.type !== '(')
                throw new SyntaxError(`unexpected bracket in \\ ${c.type}`);
            else if (c.tag === 'paren' && c.val.length === 0)
                args.push([names_1.str('_'), term(c)]);
            else if (c.tag === 'paren' && containsToken(c.val, ':')) {
                const s = splitOn(c.val, x => isToken(x, ':'));
                if (s.length !== 2)
                    throw new SyntaxError('nested anno arg :');
                const l = s[0].map(x => {
                    if (x.tag === 'token')
                        return x.val;
                    throw new SyntaxError(`invalid arg: ${x}`);
                });
                const r = terms(s[1]);
                l.forEach(n => args.push([names_1.str(n), r]));
            }
            else
                throw new SyntaxError(`invalid arg: ${c}`);
        }
        if (found < 0)
            throw new SyntaxError(`missing -> after \\`);
        const rest = x.slice(found + 1);
        if (args.length === 0)
            throw new SyntaxError('\\ without args');
        if (rest.length === 0)
            throw new SyntaxError(`missing body in function`);
        const abs = terms_1.pis(args, terms(rest));
        return stack ? terms_1.app(stack, abs) : abs;
    }
    if (stack) {
        return terms(x.slice(1), terms_1.app(stack, term(head)), mode);
    }
    else {
        return terms(x.slice(1), term(head), mode);
    }
}
function term(x) {
    if (x.tag === 'token') {
        if (x.val === '$')
            return terms_1.free(names_1.str('app'));
        if (x.val.startsWith('Type')) {
            if (x.val.length === 4)
                return terms_1.universe(0);
            const i = +x.val.slice(4);
            if (isNaN(i))
                return terms_1.free(names_1.str(x.val));
            return terms_1.universe(i < 0 ? 0 : Math.floor(i));
        }
        return terms_1.free(names_1.str(x.val));
    }
    if (x.type !== '(')
        throw new SyntaxError(`invalid bracket ${x.type}`);
    return terms(x.val);
}

},{"./names":2,"./terms":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terms_1 = require("./terms");
const util_1 = require("./util");
const names_1 = require("./names");
const context_1 = require("./context");
exports.reduce = (ctx, t) => {
    // console.log(`reduce ${showTerm(t)}`);
    if (terms_1.isFree(t))
        return context_1.findDef(ctx, t.name) || t;
    if (terms_1.isBound(t))
        return t;
    if (terms_1.isUniverse(t))
        return t;
    if (terms_1.isPi(t)) {
        const x = terms_1.freshIn(t.name, t.body);
        const body = terms_1.close(x, exports.reduce(ctx, terms_1.varOpen(x, t.body)));
        return terms_1.pi(x, t.type, body);
    }
    if (terms_1.isAbs(t)) {
        const x = terms_1.freshIn(t.name, t.body);
        const body = terms_1.close(x, exports.reduce(ctx, terms_1.varOpen(x, t.body)));
        return t.type ? terms_1.abs(x, t.type, body) : terms_1.abs_(x, body);
    }
    if (terms_1.isApp(t)) {
        const left = exports.reduce(ctx, t.left);
        return terms_1.isAbs(left) ? exports.reduce(ctx, terms_1.open(t.right, left.body)) : terms_1.app(left, exports.reduce(ctx, t.right));
    }
    if (terms_1.isAnno(t))
        return exports.reduce(ctx, t.term);
    return util_1.impossible('reduce');
};
exports.equivalent = (ctx, a, b) => equivalent_(exports.reduce(ctx, a), exports.reduce(ctx, b));
const equivalent_ = (a, b) => {
    if (terms_1.isFree(a) && terms_1.isFree(b))
        return names_1.eqName(a.name, b.name);
    if (terms_1.isBound(a) && terms_1.isBound(b))
        return a.index === b.index;
    if (terms_1.isUniverse(a) && terms_1.isUniverse(b))
        return a.index === b.index;
    if (terms_1.isPi(a) && terms_1.isPi(b))
        return equivalent_(a.type, b.type) && equivalent_(a.body, b.body);
    if (terms_1.isAbs(a) && terms_1.isAbs(b) && a.type && b.type)
        return equivalent_(a.type, b.type) && equivalent_(a.body, b.body);
    if (terms_1.isAbs(a) && terms_1.isAbs(b) && !a.type && !b.type)
        return equivalent_(a.body, b.body);
    if (terms_1.isApp(a) && terms_1.isApp(b))
        return equivalent_(a.left, b.left) && equivalent_(a.right, b.right);
    if (terms_1.isAnno(a) && terms_1.isAnno(b))
        return equivalent_(a.term, b.term) && equivalent_(a.type, b.type);
    return false;
};

},{"./context":1,"./names":2,"./terms":6,"./util":8}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const typechecker_1 = require("./typechecker");
const context_1 = require("./context");
const terms_1 = require("./terms");
const names_1 = require("./names");
const reduction_1 = require("./reduction");
const ctx = context_1.toNamelessContext([
    context_1.cvar(names_1.str('Void'), terms_1.universe(0)),
    context_1.cvar(names_1.str('void'), terms_1.pis([[names_1.str('t'), terms_1.universe(0)], [names_1.str('x'), terms_1.free(names_1.str('Void'))]], terms_1.free(names_1.str('t')))),
    context_1.cvar(names_1.str('Unit'), terms_1.universe(0)),
    context_1.cvar(names_1.str('unit'), terms_1.free(names_1.str('Unit'))),
    context_1.cvar(names_1.str('Bool'), terms_1.universe(0)),
    context_1.cvar(names_1.str('true'), terms_1.free(names_1.str('Bool'))),
    context_1.cvar(names_1.str('false'), terms_1.free(names_1.str('Bool'))),
    context_1.cvar(names_1.str('if'), terms_1.pis([
        [names_1.str('t'), terms_1.universe(0)],
        [names_1.str('c'), terms_1.free(names_1.str('Bool'))],
        [names_1.str('a'), terms_1.free(names_1.str('t'))],
        [names_1.str('b'), terms_1.free(names_1.str('t'))]
    ], terms_1.free(names_1.str('t')))),
]);
function run(s, cb) {
    if (s === ':help')
        return cb('WIP');
    try {
        console.log(s);
        const t = terms_1.toNameless(parser_1.parse(s));
        console.log(terms_1.showTerm(t));
        const ty = typechecker_1.infer(ctx, t);
        console.log(terms_1.showTerm(ty));
        const r = reduction_1.reduce(ctx, t);
        console.log(terms_1.showTerm(r));
        return cb(`${terms_1.showTerm(terms_1.toNamed(r))} : ${terms_1.showTerm(terms_1.toNamed(ty))}`);
    }
    catch (err) {
        return cb(`${err}`, true);
    }
}
exports.default = run;

},{"./context":1,"./names":2,"./parser":3,"./reduction":4,"./terms":6,"./typechecker":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const names_1 = require("./names");
const util_1 = require("./util");
const FREE = 'FREE';
exports.free = (name) => ({ tag: FREE, name });
exports.isFree = (term) => term.tag === FREE;
const BOUND = 'BOUND';
exports.bound = (index) => ({ tag: BOUND, index });
exports.isBound = (term) => term.tag === BOUND;
const UNIVERSE = 'UNIVERSE';
exports.universe = (index) => ({ tag: UNIVERSE, index });
exports.isUniverse = (term) => term.tag === UNIVERSE;
const PI = 'PI';
exports.pi = (name, type, body) => ({ tag: PI, name, type, body });
exports.isPi = (term) => term.tag === PI;
exports.pis = (ns, body) => ns.reduceRight((b, [n, t]) => exports.pi(n, t, b), body);
const ABS = 'ABS';
exports.abs = (name, type, body) => ({ tag: ABS, name, type, body });
exports.abs_ = (name, body) => exports.abs(name, null, body);
exports.isAbs = (term) => term.tag === ABS;
exports.abss = (ns, body) => ns.reduceRight((b, x) => Array.isArray(x) ? exports.abs(x[0], x[1], b) : exports.abs_(x, b), body);
const APP = 'APP';
exports.app = (left, right) => ({ tag: APP, left, right });
exports.isApp = (term) => term.tag === APP;
exports.apps = (ts) => ts.reduce(exports.app);
const ANNO = 'ANNO';
exports.anno = (term, type) => ({ tag: ANNO, term, type });
exports.isAnno = (term) => term.tag === ANNO;
exports.flattenPi = (t) => {
    const r = [];
    let c = t;
    while (exports.isPi(c)) {
        r.push([c.name, c.type]);
        c = c.body;
    }
    return { args: r, body: c };
};
exports.flattenAbs = (t) => {
    const r = [];
    let c = t;
    while (exports.isAbs(c)) {
        r.push([c.name, c.type]);
        c = c.body;
    }
    return { args: r, body: c };
};
exports.flattenApp = (t) => {
    const r = [];
    let c = t;
    while (exports.isApp(c)) {
        r.push(c.right);
        c = c.left;
    }
    r.push(c);
    return r.reverse();
};
const ARROW = ' -> ';
exports.showTerm = (t) => {
    if (exports.isFree(t))
        return names_1.showName(t.name);
    if (exports.isBound(t))
        return `#${t.index}`;
    if (exports.isUniverse(t))
        return `Type${t.index || ''}`;
    if (exports.isPi(t)) {
        const f = exports.flattenPi(t);
        return `/${f.args.map(([x, t]) => `(${names_1.showName(x)} : ${exports.showTerm(t)})`).join(' ')}${ARROW}${exports.showTerm(f.body)}`;
    }
    if (exports.isAbs(t)) {
        const f = exports.flattenAbs(t);
        return `\\${f.args.map(([x, t]) => t ? `(${names_1.showName(x)} : ${exports.showTerm(t)})` : names_1.showName(x)).join(' ')}${ARROW}${exports.showTerm(f.body)}`;
    }
    if (exports.isApp(t)) {
        const f = exports.flattenApp(t);
        return f.map(t => exports.isPi(t) || exports.isAbs(t) || exports.isApp(t) ? `(${exports.showTerm(t)})` : exports.showTerm(t)).join(' ');
    }
    if (exports.isAnno(t))
        return `(${exports.showTerm(t.term)} : ${exports.showTerm(t.type)})`;
    return util_1.impossible('showTerm');
};
exports.freeVars = (t) => {
    if (exports.isFree(t))
        return [t.name];
    if (exports.isBound(t))
        return [];
    if (exports.isUniverse(t))
        return [];
    if (exports.isPi(t))
        return exports.freeVars(t.type).concat(exports.freeVars(t.body));
    if (exports.isAbs(t))
        return (t.type ? exports.freeVars(t.type) : []).concat(exports.freeVars(t.body));
    if (exports.isApp(t))
        return exports.freeVars(t.left).concat(exports.freeVars(t.right));
    if (exports.isAnno(t))
        return exports.freeVars(t.term).concat(exports.freeVars(t.type));
    return util_1.impossible('freeVars');
};
exports.freshIn = (x, t) => names_1.fresh(exports.freeVars(t), x);
exports.freshIn2 = (x, t, u) => names_1.fresh(exports.freeVars(t).concat(exports.freeVars(u)), x);
exports.open = (u, t, k = 0) => {
    if (exports.isFree(t))
        return t;
    if (exports.isBound(t))
        return k === t.index ? u : t;
    if (exports.isUniverse(t))
        return t;
    if (exports.isPi(t))
        return exports.pi(t.name, exports.open(u, t.type, k), exports.open(u, t.body, k + 1));
    if (exports.isAbs(t))
        return exports.abs(t.name, t.type && exports.open(u, t.type, k), exports.open(u, t.body, k + 1));
    if (exports.isApp(t))
        return exports.app(exports.open(u, t.left, k), exports.open(u, t.right, k));
    if (exports.isAnno(t))
        return exports.app(exports.open(u, t.term, k), exports.open(u, t.type, k));
    return util_1.impossible('open');
};
exports.varOpen = (n, t) => exports.open(exports.free(n), t);
exports.close = (u, t, k = 0) => {
    if (exports.isFree(t))
        return names_1.eqName(u, t.name) ? exports.bound(k) : t;
    if (exports.isBound(t))
        return t;
    if (exports.isUniverse(t))
        return t;
    if (exports.isPi(t))
        return exports.pi(t.name, exports.close(u, t.type, k), exports.close(u, t.body, k + 1));
    if (exports.isAbs(t))
        return exports.abs(t.name, t.type && exports.close(u, t.type, k), exports.close(u, t.body, k + 1));
    if (exports.isApp(t))
        return exports.app(exports.close(u, t.left, k), exports.close(u, t.right, k));
    if (exports.isAnno(t))
        return exports.app(exports.close(u, t.term, k), exports.close(u, t.type, k));
    return util_1.impossible('close');
};
exports.subst = (x, u, t) => exports.open(u, exports.close(x, t));
exports.isLocallyClosed = (t, k = 0) => {
    if (exports.isFree(t))
        return true;
    if (exports.isBound(t))
        return t.index < k;
    if (exports.isUniverse(t))
        return true;
    if (exports.isPi(t))
        return exports.isLocallyClosed(t.type, k) && exports.isLocallyClosed(t.body, k + 1);
    if (exports.isAbs(t))
        return (t.type ? exports.isLocallyClosed(t.type, k) : true) && exports.isLocallyClosed(t.body, k + 1);
    if (exports.isApp(t))
        return exports.isLocallyClosed(t.left, k) && exports.isLocallyClosed(t.right, k);
    if (exports.isAnno(t))
        return exports.isLocallyClosed(t.term, k) && exports.isLocallyClosed(t.type, k);
    return util_1.impossible('isLocallyClosed');
};
exports.isClosed = (t) => exports.freeVars(t).length === 0;
exports.toNameless = (t) => {
    if (exports.isFree(t))
        return t;
    if (exports.isBound(t))
        return t;
    if (exports.isUniverse(t))
        return t;
    if (exports.isPi(t))
        return exports.pi(t.name, exports.toNameless(t.type), exports.toNameless(exports.close(t.name, t.body)));
    if (exports.isAbs(t))
        return exports.abs(t.name, t.type && exports.toNameless(t.type), exports.toNameless(exports.close(t.name, t.body)));
    if (exports.isApp(t))
        return exports.app(exports.toNameless(t.left), exports.toNameless(t.right));
    if (exports.isAnno(t))
        return exports.app(exports.toNameless(t.term), exports.toNameless(t.type));
    return util_1.impossible('toNameless');
};
exports.toNamed = (t) => {
    if (exports.isFree(t))
        return t;
    if (exports.isBound(t))
        throw new Error('bound variable in toNamed');
    if (exports.isUniverse(t))
        return t;
    if (exports.isPi(t))
        return exports.pi(t.name, exports.toNamed(t.type), exports.toNamed(exports.varOpen(t.name, t.body)));
    if (exports.isAbs(t))
        return exports.abs(t.name, t.type && exports.toNamed(t.type), exports.toNamed(exports.varOpen(t.name, t.body)));
    if (exports.isApp(t))
        return exports.app(exports.toNamed(t.left), exports.toNamed(t.right));
    if (exports.isAnno(t))
        return exports.app(exports.toNamed(t.term), exports.toNamed(t.type));
    return util_1.impossible('toNamed');
};

},{"./names":2,"./util":8}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terms_1 = require("./terms");
const context_1 = require("./context");
const names_1 = require("./names");
const reduction_1 = require("./reduction");
const err = (msg) => { throw new TypeError(msg); };
const synthUniverse = (ctx, t) => {
    const u = reduction_1.reduce(ctx, synth(ctx, t));
    if (terms_1.isUniverse(u))
        return u.index;
    return err(`universe expected but got ${terms_1.showTerm(u)} in ${context_1.showContext(ctx)}`);
};
const synth = (ctx, t) => {
    console.log(`synth ${terms_1.showTerm(t)} in ${context_1.showContext(ctx)}`);
    if (!terms_1.isLocallyClosed(t))
        return err(`not locally closed ${terms_1.showTerm(t)}`);
    if (terms_1.isFree(t)) {
        const r = context_1.findVar(ctx, t.name);
        if (r)
            return r;
        const rr = context_1.findDef(ctx, t.name);
        if (rr) {
            return synth(ctx, rr);
        }
        return err(`undefined var ${names_1.showName(t.name)}`);
    }
    if (terms_1.isBound(t))
        return err(`bound in synth ${t.index}`);
    if (terms_1.isUniverse(t))
        return terms_1.universe(t.index + 1);
    if (terms_1.isPi(t)) {
        const k1 = synthUniverse(ctx, t.type);
        const x = terms_1.freshIn(t.name, t.body);
        const k2 = synthUniverse(context_1.append(ctx, [context_1.cvar(x, reduction_1.reduce(ctx, t.type))]), terms_1.varOpen(x, t.body));
        return terms_1.universe(Math.max(k1, k2));
    }
    if (terms_1.isAbs(t) && t.type) {
        synthUniverse(ctx, t.type);
        const ty = reduction_1.reduce(ctx, t.type);
        const x = terms_1.freshIn(t.name, t.body);
        const tt = synth(context_1.append(ctx, [context_1.cvar(x, ty)]), terms_1.varOpen(x, t.body));
        return terms_1.pi(x, ty, terms_1.close(x, tt));
    }
    if (terms_1.isApp(t)) {
        const ty = reduction_1.reduce(ctx, synth(ctx, t.left));
        if (terms_1.isPi(ty)) {
            check(ctx, t.right, ty.type);
            return reduction_1.reduce(ctx, terms_1.open(t.right, ty.body));
        }
        return err(`lhs of app not a pi type: ${terms_1.showTerm(ty)} in ${terms_1.showTerm(ty)} in ${context_1.showContext(ctx)}`);
    }
    if (terms_1.isAnno(t)) {
        check(ctx, t.type, terms_1.universe(0));
        const ty = reduction_1.reduce(ctx, t.type);
        check(ctx, t.term, ty);
        return ty;
    }
    return err(`cannot synth ${terms_1.showTerm(t)} in ${context_1.showContext(ctx)}`);
};
const check = (ctx, t, u) => {
    console.log(`check ${terms_1.showTerm(t)} : ${terms_1.showTerm(u)} in ${context_1.showContext(ctx)}`);
    if (!terms_1.isLocallyClosed(t))
        return err(`not locally closed ${terms_1.showTerm(t)}`);
    if (!terms_1.isLocallyClosed(u))
        return err(`not locally closed ${terms_1.showTerm(u)}`);
    const a = reduction_1.reduce(ctx, t);
    const b = reduction_1.reduce(ctx, u);
    if (terms_1.isAbs(t) && !t.type && terms_1.isPi(u)) {
        const x = terms_1.freshIn2(t.name, t.body, u.body);
        return check(context_1.append(ctx, [context_1.cvar(x, u.type)]), terms_1.varOpen(x, t.body), terms_1.varOpen(x, u.body));
    }
    const tt = synth(ctx, t);
    if (reduction_1.equivalent(ctx, tt, u))
        return null;
    return err(`check failed ${terms_1.showTerm(t)} (${terms_1.showTerm(tt)} ~ ${terms_1.showTerm(u)}) in ${context_1.showContext(ctx)}`);
};
exports.infer = (ctx, t) => synth(ctx, t);

},{"./context":1,"./names":2,"./reduction":4,"./terms":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impossible = (msg) => { throw new Error(msg || 'impossible'); };
exports.time = (fn) => {
    const t = Date.now();
    const val = fn();
    const time = Date.now() - t;
    return { time, val };
};

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("./repl");
function getOutput(s, cb) {
    repl_1.default(s, cb);
}
var hist = [], index = -1;
var input = document.getElementById('input');
var content = document.getElementById('content');
var res = {};
function onresize() {
    content.style.height = window.innerHeight;
}
window.addEventListener('resize', onresize);
onresize();
addResult("REPL (try :help)");
input.focus();
input.onkeydown = function (keyEvent) {
    var val = input.value;
    var txt = (val || '').trim();
    if (keyEvent.keyCode === 13) {
        keyEvent.preventDefault();
        if (txt) {
            hist.push(val);
            index = hist.length;
            input.value = '';
            var div = document.createElement('div');
            div.innerHTML = val;
            div.className = 'line input';
            content.insertBefore(div, input);
            getOutput(txt, addResult);
        }
    }
    else if (keyEvent.keyCode === 38 && index > 0) {
        keyEvent.preventDefault();
        input.value = hist[--index];
    }
    else if (keyEvent.keyCode === 40 && index < hist.length - 1) {
        keyEvent.preventDefault();
        input.value = hist[++index];
    }
    else if (keyEvent.keyCode === 40 && keyEvent.ctrlKey && index >= hist.length - 1) {
        index = hist.length;
        input.value = '';
    }
};
function addResult(msg, err) {
    var divout = document.createElement('pre');
    divout.className = 'line output';
    if (err)
        divout.className += ' error';
    divout.innerHTML = '' + msg;
    content.insertBefore(divout, input);
    input.focus();
    content.scrollTop = content.scrollHeight;
    return divout;
}

},{"./repl":5}]},{},[9]);
