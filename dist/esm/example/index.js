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
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createAtomState, MngRxState, useEvent, useObservable, useSubscribe } from '../src/mng-rx';
var defaultHusband = {
    name: 'zm',
    age: 27,
};
var defaultWife = {
    name: 'zl',
    age: 28,
};
var husband$ = createAtomState({
    initState: defaultHusband,
    key: 'husband$',
    useTimeTravel: true
});
var wife$ = createAtomState({
    initState: defaultWife,
    key: 'wife$',
    useTimeTravel: true
});
function AllAge(_a) {
    var voidClick = _a.voidClick;
    var _b = useObservable({
        handler: function () { return husband$.pipe(); },
        initState: defaultHusband,
    }), husband = _b[0], husbandRef = _b[1];
    var _c = useObservable({
        handler: function () { return wife$.pipe(); },
        initState: defaultWife,
    }), wife = _c[0], wifeRef = _c[1];
    var _d = useEvent(), addAllAge$ = _d[0], addAllAge = _d[1];
    useSubscribe(addAllAge$, {
        next: function (e) {
            husband$.next(__assign(__assign({}, husbandRef.current), { age: husbandRef.current.age + 1 }));
            wife$.next(__assign(__assign({}, wifeRef.current), { age: wifeRef.current.age + 1 }));
            voidClick();
        },
    });
    return (React.createElement(React.Fragment, null,
        "all age: ",
        husband.age + wife.age,
        React.createElement("hr", null),
        React.createElement("button", { onClick: addAllAge }, "add all age")));
}
function App() {
    var _a = useObservable({
        handler: function () { return husband$.pipe(); },
        initState: defaultHusband,
    }), husband = _a[0], husbandRef = _a[1];
    var _b = useObservable({
        handler: function () { return wife$.pipe(); },
        initState: defaultWife,
    }), wife = _b[0], wifeRef = _b[1];
    var _c = useEvent(), addHusbandAge$ = _c[0], addHusbandAge = _c[1];
    var _d = useEvent(), addWifeAge$ = _d[0], addWifeAge = _d[1];
    var _e = useEvent(), voidClick$ = _e[0], voidClick = _e[1];
    useSubscribe(voidClick$, {
        next: function () {
            console.log("called voidClick callback");
        }
    });
    useSubscribe(addHusbandAge$, {
        next: function () {
            husband$.next(__assign(__assign({}, husbandRef.current), { age: husbandRef.current.age + 1 }));
        },
    });
    useSubscribe(addWifeAge$, {
        next: function () {
            wife$.next(__assign(__assign({}, wifeRef.current), { age: wifeRef.current.age + 1 }));
        },
    });
    useEffect(function () {
        // init the state manager
        MngRxState.init();
    }, []);
    return (React.createElement("div", null,
        "husband: ",
        husband.name,
        React.createElement("hr", null),
        "age: ",
        husband.age,
        React.createElement("hr", null),
        "wife: ",
        wife.name,
        React.createElement("hr", null),
        "age: ",
        wife.age,
        React.createElement("hr", null),
        React.createElement("button", { onClick: addHusbandAge, style: {
                marginRight: 12,
            } }, "add husband age"),
        React.createElement("button", { onClick: addWifeAge }, "add wife age"),
        React.createElement("hr", null),
        React.createElement(AllAge, { voidClick: voidClick }),
        React.createElement("hr", null),
        React.createElement("div", { style: {
                display: 'flex',
                marginTop: 10
            } },
            React.createElement("button", { onClick: function () { return MngRxState.goPast(); }, style: { marginRight: 10 } }, "prev"),
            React.createElement("button", { onClick: function () { return MngRxState.goFuture(); } }, "next"))));
}
ReactDOM.render(React.createElement(App, null), document.getElementById('app'));
