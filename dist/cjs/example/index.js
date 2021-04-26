"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var react_dom_1 = __importDefault(require("react-dom"));
var mng_rx_1 = require("../src/mng-rx");
var defaultHusband = {
    name: 'zm',
    age: 27,
};
var defaultWife = {
    name: 'zl',
    age: 28,
};
var husband$ = mng_rx_1.createAtomState({
    initState: defaultHusband,
    key: 'husband$',
    useTimeTravel: true
});
var wife$ = mng_rx_1.createAtomState({
    initState: defaultWife,
    key: 'wife$',
    useTimeTravel: true
});
function AllAge(_a) {
    var voidClick = _a.voidClick;
    var _b = mng_rx_1.useObservable({
        handler: function () { return husband$.pipe(); },
        initState: defaultHusband,
    }), husband = _b[0], husbandRef = _b[1];
    var _c = mng_rx_1.useObservable({
        handler: function () { return wife$.pipe(); },
        initState: defaultWife,
    }), wife = _c[0], wifeRef = _c[1];
    var _d = mng_rx_1.useEvent(), addAllAge$ = _d[0], addAllAge = _d[1];
    mng_rx_1.useSubscribe(addAllAge$, {
        next: function (e) {
            husband$.next(__assign(__assign({}, husbandRef.current), { age: husbandRef.current.age + 1 }));
            wife$.next(__assign(__assign({}, wifeRef.current), { age: wifeRef.current.age + 1 }));
            voidClick();
        },
    });
    return (react_1.default.createElement(react_1.default.Fragment, null,
        "all age: ",
        husband.age + wife.age,
        react_1.default.createElement("hr", null),
        react_1.default.createElement("button", { onClick: addAllAge }, "add all age")));
}
function App() {
    var _a = mng_rx_1.useObservable({
        handler: function () { return husband$.pipe(); },
        initState: defaultHusband,
    }), husband = _a[0], husbandRef = _a[1];
    var _b = mng_rx_1.useObservable({
        handler: function () { return wife$.pipe(); },
        initState: defaultWife,
    }), wife = _b[0], wifeRef = _b[1];
    var _c = mng_rx_1.useEvent(), addHusbandAge$ = _c[0], addHusbandAge = _c[1];
    var _d = mng_rx_1.useEvent(), addWifeAge$ = _d[0], addWifeAge = _d[1];
    var _e = mng_rx_1.useEvent(), voidClick$ = _e[0], voidClick = _e[1];
    mng_rx_1.useSubscribe(voidClick$, {
        next: function () {
            console.log("called voidClick callback");
        }
    });
    mng_rx_1.useSubscribe(addHusbandAge$, {
        next: function () {
            husband$.next(__assign(__assign({}, husbandRef.current), { age: husbandRef.current.age + 1 }));
        },
    });
    mng_rx_1.useSubscribe(addWifeAge$, {
        next: function () {
            wife$.next(__assign(__assign({}, wifeRef.current), { age: wifeRef.current.age + 1 }));
        },
    });
    react_1.useEffect(function () {
        // init the state manager
        mng_rx_1.MngRxState.init();
    }, []);
    return (react_1.default.createElement("div", null,
        "husband: ",
        husband.name,
        react_1.default.createElement("hr", null),
        "age: ",
        husband.age,
        react_1.default.createElement("hr", null),
        "wife: ",
        wife.name,
        react_1.default.createElement("hr", null),
        "age: ",
        wife.age,
        react_1.default.createElement("hr", null),
        react_1.default.createElement("button", { onClick: addHusbandAge, style: {
                marginRight: 12,
            } }, "add husband age"),
        react_1.default.createElement("button", { onClick: addWifeAge }, "add wife age"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(AllAge, { voidClick: voidClick }),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("div", { style: {
                display: 'flex',
                marginTop: 10
            } },
            react_1.default.createElement("button", { onClick: function () { return mng_rx_1.MngRxState.goPast(); }, style: { marginRight: 10 } }, "prev"),
            react_1.default.createElement("button", { onClick: function () { return mng_rx_1.MngRxState.goFuture(); } }, "next"))));
}
react_dom_1.default.render(react_1.default.createElement(App, null), document.getElementById('app'));
