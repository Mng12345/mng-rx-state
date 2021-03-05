import React from "react";
import { BehaviorSubject, Observable, PartialObserver, Subject } from "rxjs";
export declare function useStateRef<T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>];
export declare function createAtomState<T>(defaultValue: T): BehaviorSubject<T>;
declare type Handler<T> = () => Observable<T>;
export declare function useObservable<T>(options: {
    handler: Handler<T>;
}): [T | undefined, React.MutableRefObject<T | undefined>];
export declare function useObservable<T>(options: {
    handler: Handler<T>;
    initState: T;
}): [T, React.MutableRefObject<T>];
export declare function useConstant<T>(defaultValue: T): T;
export declare function useEvent<T>(): [Subject<T>, (e: T) => void];
export declare function useSubscribe<T>(state$: Observable<T>, observer: PartialObserver<T>): void;
export {};