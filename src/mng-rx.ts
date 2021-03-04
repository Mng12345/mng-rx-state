import React, {useEffect, useRef, useState} from "react";
import {BehaviorSubject, Observable, PartialObserver, Subject} from "rxjs";

export const useStateRef = function <T>(initValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>] {
  const [state, setState] = useState(initValue)
  const ref = useRef(state)
  return [state, setState, ref]
}

export const createAtomState = function<T>(defaultValue: T) {
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
  const [state, setState, ref] = useStateRef<T | undefined>(initState ? initState : undefined)
  const new$ = handler()
  useEffect(() => {
    const newSubs = new$.subscribe({
      next(value: T) {
        setState(value)
        ref.current = value
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

export function useEvent<T>(): [Subject<T>, (e: T) => void] {
  const event$ = useConstant(new Subject<T>())
  const eventCallback = (e: T) => {
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
