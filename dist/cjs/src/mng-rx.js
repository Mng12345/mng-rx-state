"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalObservable = exports.useSubscribe = exports.useEvent = exports.useConstant = exports.useObservable = exports.createAtomState = exports.useStateRef = exports.MngRxState = void 0;
var react_1 = require("react");
var rxjs_1 = require("rxjs");
var uuid_1 = require("uuid");
var chalk_1 = __importDefault(require("chalk"));
var linked_1 = require("mng-easy-util/algorithm/linked");
var MngRxState;
(function (MngRxState) {
    MngRxState.stateMap = new Map();
    var currentState = new linked_1.LinkedNode(new Map());
    // control the state update process
    var timeTraveling = false;
    var stateChangeFromUser$ = new rxjs_1.BehaviorSubject(true);
    var getAllStatesInMap = function () {
        var entries = MngRxState.stateMap.entries();
        var result = [];
        for (;;) {
            var entry = entries.next();
            if (entry.done)
                break;
            result.push(entry.value);
        }
        return result;
    };
    // time travel!
    MngRxState.goPast = function () {
        if (currentState.prev) {
            currentState = currentState.prev;
            stateChangeFromUser$.next(false);
        }
    };
    MngRxState.goFuture = function () {
        if (currentState.next) {
            currentState = currentState.next;
            stateChangeFromUser$.next(false);
        }
    };
    // need call this function before you application started
    MngRxState.init = function () {
        var timeTravelStates = getAllStatesInMap();
        var stateObservables = timeTravelStates.map(function (state) { return state[1]; });
        // automatically record the change of state
        rxjs_1.combineLatest(__spreadArray(__spreadArray([], stateObservables), [stateChangeFromUser$]))
            .subscribe({
            next: function (values) {
                // if state is under time traveling, skip this observer
                if (timeTraveling)
                    return;
                // update currentState
                var newCurrentState = new linked_1.LinkedNode(new Map());
                var timeTravelValues = values.slice(0, values.length - 1);
                var stateChangeFromUser = values[values.length - 1];
                if (stateChangeFromUser) {
                    timeTravelValues.forEach(function (value, index) {
                        newCurrentState.value.set(timeTravelStates[index][0], value);
                    });
                    currentState.addNode(newCurrentState);
                    currentState = newCurrentState;
                }
                else {
                    // start time travel
                    timeTraveling = true;
                    // state change from time travel
                    var entries = currentState.value.entries();
                    for (var index = 0;; index++) {
                        var entry = entries.next();
                        if (entry.done)
                            break;
                        var _a = entry.value, key = _a[0], value = _a[1];
                        // update the changed state
                        if (value !== values[index]) {
                            MngRxState.stateMap.get(key).next(value);
                        }
                    }
                    // after state change complete, make state change from user again
                    stateChangeFromUser$.next(true);
                    // end time travel
                    timeTraveling = false;
                }
            }
        });
    };
})(MngRxState = exports.MngRxState || (exports.MngRxState = {}));
// sync state and ref automatically while calling setState
function useStateRef(initValue) {
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
}
exports.useStateRef = useStateRef;
function createAtomState(_a) {
    var initState = _a.initState, key = _a.key, _b = _a.useTimeTravel, useTimeTravel = _b === void 0 ? false : _b;
    var $ = new rxjs_1.BehaviorSubject(initState);
    key = key ? key : uuid_1.v4();
    if (MngRxState.stateMap.has(key))
        console.log(chalk_1.default.yellowBright("warning: the key[" + key + "] already exists!"));
    if (useTimeTravel)
        MngRxState.stateMap.set(key, $);
    return $;
}
exports.createAtomState = createAtomState;
function useObservable(_a) {
    var handler = _a.handler, initState = _a.initState;
    var _b = useStateRef(initState !== undefined ? initState : undefined), state = _b[0], setState = _b[1], ref = _b[2];
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
    var ref = react_1.useRef();
    if (!ref.current) {
        // @ts-ignore
        ref.current = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    return ref.current;
}
exports.useConstant = useConstant;
function useEvent() {
    var event$ = useConstant(new rxjs_1.Subject());
    var eventCallback = function (e) {
        var _a;
        // fix released/nullified synthetic event
        if ((_a = e) === null || _a === void 0 ? void 0 : _a.persist)
            e.persist();
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
function useLocalObservable(initState) {
    var stream$ = useConstant(function () { return createAtomState({
        initState: initState
    }); });
    var _a = useObservable({
        handler: function () { return stream$.pipe(); },
        initState: initState
    }), value = _a[0], valueRef = _a[1];
    return [stream$, value, valueRef];
}
exports.useLocalObservable = useLocalObservable;
