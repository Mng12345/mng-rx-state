import React from 'react';
import { BehaviorSubject, Observable, PartialObserver, Subject } from 'rxjs';
/**
 * @deprecated
 */
export declare namespace MngRxState {
    const stateMap: Map<string, BehaviorSubject<any>>;
    const goPast: () => void;
    const goFuture: () => void;
    const init: () => void;
}
export declare function useStateRef<T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>];
export declare function createAtomState(options: {}): BehaviorSubject<undefined>;
export declare function createAtomState(options: {
    key: string;
}): BehaviorSubject<undefined>;
export declare function createAtomState<T>(options: {
    initState: T;
}): BehaviorSubject<T>;
export declare function createAtomState<T>(options: {
    initState: T;
    key: string;
    useTimeTravel: boolean;
}): BehaviorSubject<T>;
declare type Handler<T> = () => Observable<T>;
export declare function useObservable<T>(options: {
    handler: Handler<T>;
}): [T | undefined, React.MutableRefObject<T | undefined>];
export declare function useObservable<T>(options: {
    handler: Handler<T>;
    initState: T;
}): [T, React.MutableRefObject<T>];
export declare function useConstant<T>(constructor: () => T): T;
export declare function useConstant<T>(defaultValue: T): T;
export declare type NotUndefined<T> = T extends undefined ? never : T;
export declare function useEvent(): [Subject<undefined>, () => void];
export declare function useEvent<T, R = NotUndefined<T>>(): [Subject<R>, (e: R) => void];
export declare function useSubscribe<T>(state$: Observable<T>, observer: PartialObserver<T>): void;
export declare function useLocalObservable<T>(initState: T): [BehaviorSubject<T>, T, React.MutableRefObject<T>];
export {};
