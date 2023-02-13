
type compose =
    <A, B>(f: (a: A) => B) =>
        <C>(g: (b: B) => C) =>
            (a: A) => C;
const compose: compose =
    f => g =>
        a => g(f(a));

type Reactive<A> = {
    lastVal: A, // mutable
    lastFns: Array<((a: A) => void)>, // mutable
} & operators;

type R = <A> (a: A) => Reactive<A>;
const R: R = a =>
    Object.defineProperties(
        Object.assign(
            {
                lastVal: a, // mutable
                lastFns: [],// mutable
            },
            operators),
        {
            lastVal: {
                writable: true, // mutable
                enumerable: true, // visible
                configurable: false
            },
            lastFns: {
                writable: true, // mutable
                enumerable: false, // invisible
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
        }
    );

type next = <A>(a: A) => (rA: Reactive<A>) => Reactive<A>;
const next: next = x => rA => {
    rA.lastVal = x; // mutable
    const fns = rA.lastFns;
    fns.map(fn => fn(x)); //perform all fns in the list
    return rA;
};
//-------------------------------------
type _propagate = <A, B>
    (f: (a: A) => Reactive<B>) =>
    (rB: Reactive<B>) => (a: A) => void;
const _propagate: _propagate =
    f => rB => a => {
        const rfa = (f)(a);
        const b = rfa.lastVal;
        rB.next(b);
        return undefined;
    };

type flatMap = <A, B>
    (f: (a: A) => Reactive<B>) =>
    (rA: Reactive<A>) => Reactive<B>;
const flatMap: flatMap =
    f => rA => {
        const val = rA.lastVal;
        const fns = rA.lastFns;
        const rB = (f)(val);
        const plusFn = _propagate(f)(rB);
        const newFns = fns.concat([plusFn]);
        rA.lastFns = newFns; // mutable
        return rB;
    };
//--------------------------------------
type Monadic = <A, B>
    (f: (a: A) => B) =>
    (a: A) => Reactive<B>;
const monadic: Monadic =
    f => compose(f)(R);

type Map = <A, B>
    (f: (a: A) => B) =>
    (rA: Reactive<A>) => Reactive<B>;
const map: Map = f => flatMap(monadic(f));

//--------------------------------------

type operators = {
    flatMap: <A, B>(
        this: Reactive<A>,
        f: (a: A) => Reactive<B>
    ) => Reactive<B>,
    map: <A, B>(
        this: Reactive<A>,
        f: (a: A) => B
    ) => Reactive<B>,
    //-------------------------
    next: <A>(
        this: Reactive<A>,
        a: A
    ) => Reactive<A>
};

const operators: operators = {
    flatMap: function (this, f) {
        return flatMap(f)(this);
    },
    map: function (this, f) {
        return map(f)(this);
    },
    //-------------------------
    next: function (this, a) {
        return next(a)(this);
    }
};

export { R, monadic };
export type { Reactive, Monadic };