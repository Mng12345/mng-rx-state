import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { BehaviorSubject, Observable, PartialObserver, Subject } from 'rxjs';
declare type AtomState<T> = {
    $: BehaviorSubject<T>;
    default: T;
};
export declare const travelMachineState: AtomState<{
    canGoToFuture: boolean;
    canGoToPast: boolean;
}>;
export declare function goPast(): void;
export declare function goFuture(): void;
export declare function init(): void;
export declare function useStateRef<T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>];
export declare function createAtomState(): AtomState<undefined>;
export declare function createAtomState(options: {
    key: string;
}): AtomState<undefined>;
export declare function createAtomState<T>(options: {
    initState: T;
}): AtomState<T>;
export declare function createAtomState<T>(options: {
    initState: T;
    key: string;
    useTimeTravel: boolean;
}): AtomState<T>;
export declare function useAtomState<T>(atomState: AtomState<T>): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>];
export declare function useConstant<T>(constructor: () => T): T;
export declare function useConstant<T>(defaultValue: T): T;
export declare type NotUndefined<T> = T extends undefined ? never : T;
export declare function useEvent(): [Subject<undefined>, () => void];
export declare function useEvent<T, R = NotUndefined<T>>(): [Subject<R>, (e: R) => void];
export declare function useSubscribe<T>(state$: Observable<T>, observer: PartialObserver<T>): void;
export declare function useLocalObservable<T>(initState: T): [BehaviorSubject<T>, T, React.MutableRefObject<T>];
export declare function snapshot(): void;
export {};
