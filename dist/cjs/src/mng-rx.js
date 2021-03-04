"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubscribe = exports.useEvent = exports.useConstant = exports.useObservable = exports.createAtomState = exports.useStateRef = void 0;
var react_1 = require("react");
var rxjs_1 = require("rxjs");
// sync state and ref automatically while calling setState
var useStateRef = function (initValue) {
    if (initValue instanceof Function) {
        throw "you should avoid to use state as function";
    }
    var _a = react_1.useState(initValue), state = _a[0], setState = _a[1];
    var ref = react_1.useRef(state);
    // proxy setState to update ref while calling setState
    var setStateProxy = function (s) {
        if (s instanceof Function) {
            // proxy s function and update ref
            var sProxy = function (preS) {
                ref.current = s(preS);
                return ref.current;
            };
            setState(sProxy);
        }
        else {
            ref.current = s;
            setState(s);
        }
    };
    return [state, setStateProxy, ref];
};
exports.useStateRef = useStateRef;
var createAtomState = function (defaultValue) {
    return new rxjs_1.BehaviorSubject(defaultValue);
};
exports.createAtomState = createAtomState;
function useObservable(_a) {
    var handler = _a.handler, initState = _a.initState;
    var _b = exports.useStateRef(initState ? initState : undefined), state = _b[0], setState = _b[1], ref = _b[2];
    var new$ = handler();
    react_1.useEffect(function () {
        var newSubs = new$.subscribe({
            next: function (value) {
                setState(value);
            }
        });
        return function () {
            newSubs.unsubscribe();
        };
    }, []);
    return [state, ref];
}
exports.useObservable = useObservable;
function useConstant(defaultValue) {
    var ref = react_1.useRef(defaultValue);
    return ref.current;
}
exports.useConstant = useConstant;
function useEvent() {
    var event$ = useConstant(new rxjs_1.Subject());
    var eventCallback = function (e) {
        event$.next(e);
    };
    return [event$, eventCallback];
}
exports.useEvent = useEvent;
function useSubscribe(state$, observer) {
    react_1.useEffect(function () {
        var subs = state$.pipe().subscribe(observer);
        return function () {
            subs.unsubscribe();
        };
    }, []);
}
exports.useSubscribe = useSubscribe;
