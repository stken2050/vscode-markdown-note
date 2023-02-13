"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monadic = exports.R = void 0;
const compose = f => g => a => g(f(a));
const R = a => Object.defineProperties(Object.assign({
    lastVal: a,
    lastFns: [], // mutable
}, operators), {
    lastVal: {
        writable: true,
        enumerable: true,
        configurable: false
    },
    lastFns: {
        writable: true,
        enumerable: false,
        configurable: false
    },
    flatMap: {
        writable: false,
        enumerable: false,
        configurable: false
    },
    map: {
        writable: false,
        enumerable: false,
        configurable: false
    },
    next: {
        writable: false,
        enumerable: false,
        configurable: false
    }
});
exports.R = R;
const next = x => rA => {
    rA.lastVal = x; // mutable
    const fns = rA.lastFns;
    fns.map(fn => fn(x)); //perform all fns in the list
    return rA;
};
const _propagate = f => rB => a => {
    const rfa = (f)(a);
    const b = rfa.lastVal;
    rB.next(b);
    return undefined;
};
const flatMap = f => rA => {
    const val = rA.lastVal;
    const fns = rA.lastFns;
    const rB = (f)(val);
    const plusFn = _propagate(f)(rB);
    const newFns = fns.concat([plusFn]);
    rA.lastFns = newFns; // mutable
    return rB;
};
const monadic = f => compose(f)(R);
exports.monadic = monadic;
const map = f => flatMap(monadic(f));
const operators = {
    flatMap: function (f) {
        return flatMap(f)(this);
    },
    map: function (f) {
        return map(f)(this);
    },
    //-------------------------
    next: function (a) {
        return next(a)(this);
    }
};
//# sourceMappingURL=reactive_monad.js.map