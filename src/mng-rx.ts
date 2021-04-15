import React, {useEffect, useRef, useState} from "react";
import {BehaviorSubject, Observable, PartialObserver, Subject} from "rxjs";

// sync state and ref automatically while calling setState
export function useStateRef<T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>] {
  if (initValue instanceof Function) {
    throw `you should avoid to use state as function`
  }
  const [state, setState] = useState(initValue)
  const ref = useRef(state)
  // proxy setState to update ref while calling setState
  const setStateProxy = (s: T | ((preS: T) => T)) => {
    if (s instanceof Function) {
      // proxy s function and update ref
      const sProxy = (preS: T) => {
        ref.current = s(preS)
        return ref.current
      }
      setState(sProxy)
    } else {
      ref.current = s
      setState(s)
    }
  }
  return [state, setStateProxy, ref]
}

export function createAtomState(): BehaviorSubject<undefined>;
export function createAtomState<T, R=NotUndefined<T>>(defaultValue: T): BehaviorSubject<R>;
export function createAtomState<T>(defaultValue?: T) {
  return new BehaviorSubject(defaultValue)
}

type Handler<T> = () => Observable<T>

export function useObservable<T>(options: {
  handler: Handler<T>
}): [T | undefined, React.MutableRefObject<T | undefined>]
export function useObservable<T>(options: {
  handler: Handler<T>
  initState: T
}): [T, React.MutableRefObject<T>]

export function useObservable<T>({
  handler,
  initState
}: {
  handler: Handler<T>,
  initState?: T
}, ) {
  const [state, setState, ref] = useStateRef<T | undefined>(initState !== undefined ? initState : undefined)
  const new$ = handler()
  useEffect(() => {
    const newSubs = new$.subscribe({
      next(value: T) {
        setState(value)
      }
    })
    return () => {
      newSubs.unsubscribe()
    }
  }, [])
  return [state, ref]
}

export function useConstant<T>(defaultValue: T) {
  const ref = useRef(defaultValue)
  return ref.current
}

export type NotUndefined<T> = T extends undefined ? never : T

export function useEvent(): [Subject<undefined>, () => void];
export function useEvent<T, R=NotUndefined<T>>(): [Subject<R>, (e: R) => void];

export function useEvent<T>(): [Subject<T>, ((e: T) => void) | (() => void)] {
  const event$ = useConstant(new Subject<T>())
  const eventCallback = (e: T) => {
    // fix released/nullified synthetic event
    if ((e as any)?.persist)
      (e as any).persist()
    event$.next(e)
  }
  return [event$, eventCallback]
}

export function useSubscribe<T>(state$: Observable<T>, observer: PartialObserver<T>) {
  useEffect(() => {
    const subs = state$.pipe().subscribe(observer)
    return () => {
      subs.unsubscribe()
    }
  }, [])
}

export function useLocalObservable<T, R=NotUndefined<T>>(initState: R): [BehaviorSubject<R>, R, React.MutableRefObject<R>] {
  const stream$ = useConstant(createAtomState<R>(initState))
  const [value, valueRef] = useObservable({
    handler: () => stream$.pipe(),
    initState
  })
  return [stream$ as unknown as BehaviorSubject<R>, value, valueRef]
}


