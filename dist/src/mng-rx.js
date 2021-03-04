"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubscribe = exports.useEvent = exports.useConstant = exports.useObservable = exports.createAtomState = exports.useStateRef = void 0;
var react_1 = require("react");
var rxjs_1 = require("rxjs");
var useStateRef = function (initValue) {
    var _a = react_1.useState(initValue), state = _a[0], setState = _a[1];
    var ref = react_1.useRef(state);
    return [state, setState, ref];
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
                ref.current = value;
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
