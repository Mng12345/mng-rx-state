import { useEffect, useRef, useState } from "react";
import { BehaviorSubject, Subject } from "rxjs";
// sync state and ref automatically while calling setState
export function useStateRef(initValue) {
    if (initValue instanceof Function) {
        throw "you should avoid to use state as function";
    }
    var _a = useState(initValue), state = _a[0], setState = _a[1];
    var ref = useRef(state);
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
}
export function createAtomState(defaultValue) {
    return new BehaviorSubject(defaultValue);
}
export function useObservable(_a) {
    var handler = _a.handler, initState = _a.initState;
    var _b = useStateRef(initState ? initState : undefined), state = _b[0], setState = _b[1], ref = _b[2];
    var new$ = handler();
    useEffect(function () {
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
export function useConstant(defaultValue) {
    var ref = useRef(defaultValue);
    return ref.current;
}
export function useEvent() {
    var event$ = useConstant(new Subject());
    var eventCallback = function (e) {
        event$.next(e);
    };
    return [event$, eventCallback];
}
export function useSubscribe(state$, observer) {
    useEffect(function () {
        var subs = state$.pipe().subscribe(observer);
        return function () {
            subs.unsubscribe();
        };
    }, []);
}
