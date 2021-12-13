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
exports.snapshot = exports.useLocalObservable = exports.useSubscribe = exports.useEvent = exports.useConstant = exports.useAtomState = exports.createAtomState = exports.useStateRef = exports.init = exports.goFuture = exports.goPast = exports.travelMachineState = void 0;
var chalk_1 = __importDefault(require("chalk"));
var react_1 = require("react");
var linked_1 = require("mng-easy-util/cjs/algorithm/linked");
var rxjs_1 = require("rxjs");
var options_1 = require("mng-easy-util/cjs/options");
var Mutables = /** @class */ (function () {
    function Mutables() {
    }
    Mutables.timeTraveling = false;
    Mutables.initDone = false;
    Mutables.currentStateNode = options_1.Option.empty();
    Mutables.currentState = options_1.Option.empty();
    Mutables.currentSnapshot = options_1.Option.empty();
    return Mutables;
}());
var Immutables = /** @class */ (function () {
    function Immutables() {
    }
    Immutables.stateMap = new Map();
    // control the state update process
    Immutables.stateChangeFromUser$ = new rxjs_1.BehaviorSubject(true);
    return Immutables;
}());
// the state of travel machine
exports.travelMachineState = createAtomState({
    initState: {
        canGoToFuture: false,
        canGoToPast: false,
    },
});
function getAllStatesInMap() {
    var entries = Immutables.stateMap.entries();
    var result = [];
    for (;;) {
        var entry = entries.next();
        if (entry.done)
            break;
        result.push(entry.value);
    }
    return result;
}
// time travel!
function goPast() {
    if (Mutables.currentStateNode.hasValue()) {
        var currentState = Mutables.currentStateNode.unwrap();
        var prevState = currentState.prev;
        if (prevState !== null) {
            Mutables.currentStateNode = options_1.Option.of(prevState);
            Immutables.stateChangeFromUser$.next(false);
        }
    }
}
exports.goPast = goPast;
function goFuture() {
    if (Mutables.currentStateNode.hasValue()) {
        var currentState = Mutables.currentStateNode.unwrap();
        var nextState = currentState.next;
        if (nextState !== null) {
            Mutables.currentStateNode = options_1.Option.of(nextState);
            Immutables.stateChangeFromUser$.next(false);
        }
    }
}
exports.goFuture = goFuture;
// need call this function before you application started
function init() {
    if (Mutables.initDone) {
        console.log(chalk_1.default.yellowBright("the init api can only be called once!"));
        return;
    }
    var timeTravelStates = getAllStatesInMap();
    var stateObservables = timeTravelStates.map(function (state) { return state[1]; });
    // automatically record the change of state
    rxjs_1.combineLatest(__spreadArray(__spreadArray([], stateObservables), [Immutables.stateChangeFromUser$])).subscribe({
        next: function (values) {
            // if state is under time traveling, skip this observer
            if (Mutables.timeTraveling)
                return;
            // update currentState
            var newCurrentState = new Map();
            var timeTravelValues = values.slice(0, values.length - 1);
            var stateChangeFromUser = values[values.length - 1];
            if (stateChangeFromUser) {
                timeTravelValues.forEach(function (value, index) {
                    newCurrentState.set(timeTravelStates[index][0], value);
                });
                Mutables.currentState = options_1.Option.of(newCurrentState);
                // notify timeTravelMachineState, make sure that the init is done
                if (Mutables.initDone) {
                    exports.travelMachineState.$.next({
                        canGoToFuture: false,
                        canGoToPast: true,
                    });
                }
            }
            else {
                // start time travel
                Mutables.timeTraveling = true;
                // state change from time travel
                if (Mutables.currentStateNode.hasValue()) {
                    var entries = Mutables.currentStateNode.unwrap().value.entries();
                    for (var index = 0;; index++) {
                        var entry = entries.next();
                        if (entry.done)
                            break;
                        var _a = entry.value, key = _a[0], value = _a[1];
                        // update the changed state
                        if (value !== values[index]) {
                            Immutables.stateMap.get(key).next(value);
                        }
                    }
                }
                // after state change complete, make state change from user again
                Immutables.stateChangeFromUser$.next(true);
                // end time travel
                Mutables.timeTraveling = false;
                // update timeTravelMachineState when call goPast or goFuture
                if (Mutables.currentStateNode.hasValue()) {
                    exports.travelMachineState.$.next({
                        canGoToFuture: Mutables.currentStateNode.unwrap().next !== null,
                        canGoToPast: Mutables.currentStateNode.unwrap().prev !== null,
                    });
                }
            }
        },
    });
    // init done
    Mutables.initDone = true;
}
exports.init = init;
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
function optionsIsUndefined(options) {
    return options === undefined;
}
function optionsIsKey(options) {
    return options && options.key !== undefined && options.initState === undefined && options.useTimeTravel === undefined;
}
function optionsIsInitState(options) {
    return options && options.key === undefined && options.initState !== undefined && options.useTimeTravel === undefined;
}
function optionsIsFull(options) {
    return options && options.key !== undefined && options.initState !== undefined && options.useTimeTravel !== undefined;
}
function createAtomState(options) {
    if (optionsIsUndefined(options)) {
        var $ = new rxjs_1.BehaviorSubject(undefined);
        return {
            $: $,
            default: undefined,
        };
    }
    else if (optionsIsFull(options)) {
        var key = options.key;
        var $ = new rxjs_1.BehaviorSubject(options.initState);
        if (Immutables.stateMap.has(key))
            console.log(chalk_1.default.yellowBright("warning: the key[" + key + "] already exists!"));
        if (options.useTimeTravel)
            Immutables.stateMap.set(key, $);
        return {
            $: $,
            default: options.initState,
        };
    }
    else if (optionsIsKey(options)) {
        var $ = new rxjs_1.BehaviorSubject(undefined);
        return {
            $: $,
            default: undefined,
        };
    }
    else {
        var $ = new rxjs_1.BehaviorSubject(options.initState);
        return {
            $: $,
            default: options.initState,
        };
    }
}
exports.createAtomState = createAtomState;
function isFunction(value) {
    return typeof value === 'function';
}
function useAtomState(atomState) {
    var _a = useStateRef(atomState.default), state = _a[0], setState = _a[1], ref = _a[2];
    var new$ = atomState.$.pipe();
    // use new$.next replace setState
    function setStateProxy(value) {
        if (isFunction(value)) {
            var newValue = value(ref.current);
            atomState.$.next(newValue);
        }
        else {
            atomState.$.next(value);
        }
    }
    react_1.useEffect(function () {
        var newSubs = new$.subscribe({
            next: function (value) {
                setState(value);
            },
        });
        return function () {
            newSubs.unsubscribe();
        };
    }, []);
    return [state, setStateProxy, ref];
}
exports.useAtomState = useAtomState;
function useConstant(defaultValue) {
    var ref = react_1.useRef();
    if (!ref.current) {
        ref.current = isFunction(defaultValue) ? defaultValue() : defaultValue;
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
    var stream = useConstant(function () {
        return createAtomState({
            initState: initState,
        });
    });
    var _a = useAtomState(stream), value = _a[0], setValue = _a[1], valueRef = _a[2];
    return [stream.$, value, valueRef];
}
exports.useLocalObservable = useLocalObservable;
function snapshot() {
    // exit when undering time traveling or Mutables.currentState is empty
    if (Mutables.timeTraveling || Mutables.currentState.isEmpty()) {
        return;
    }
    if (Mutables.currentSnapshot.isEmpty() || Mutables.currentSnapshot.unwrap() !== Mutables.currentState.unwrap()) {
        // add snapshot when Mutables.currentStateSnapshot is empty or Mutables.currentState is updated
        if (Mutables.currentStateNode.hasValue()) {
            var currentStateNode = Mutables.currentStateNode.unwrap();
            var newStateNode = new linked_1.LinkedNode(Mutables.currentState.unwrap());
            currentStateNode.addNode(newStateNode);
            Mutables.currentStateNode = options_1.Option.of(newStateNode);
        }
        else {
            Mutables.currentStateNode = options_1.Option.of(new linked_1.LinkedNode(Mutables.currentState.unwrap()));
        }
        Mutables.currentSnapshot = options_1.Option.of(Mutables.currentState.unwrap());
    }
}
exports.snapshot = snapshot;
