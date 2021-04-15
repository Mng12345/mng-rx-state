import React from "react";
import { BehaviorSubject, Observable, PartialObserver, Subject } from "rxjs";
export declare function useStateRef<T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>];
export declare function createAtomState(): BehaviorSubject<undefined>;
export declare function createAtomState<T, R = NotUndefined<T>>(defaultValue: T): BehaviorSubject<R>;
declare type Handler<T> = () => Observable<T>;
export declare function useObservable<T>(options: {
    handler: Handler<T>;
}): [T | undefined, React.MutableRefObject<T | undefined>];
export declare function useObservable<T>(options: {
    handler: Handler<T>;
    initState: T;
}): [T, React.MutableRefObject<T>];
export declare function useConstant<T>(defaultValue: T): T;
export declare type NotUndefined<T> = T extends undefined ? never : T;
export declare function useEvent(): [Subject<undefined>, () => void];
export declare function useEvent<T, R = NotUndefined<T>>(): [Subject<R>, (e: R) => void];
export declare function useSubscribe<T>(state$: Observable<T>, observer: PartialObserver<T>): void;
export declare function useLocalObservable<T, R = NotUndefined<T>>(initState: R): [BehaviorSubject<R>, R, React.MutableRefObject<R>];
export {};
