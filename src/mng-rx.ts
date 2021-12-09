import React, { useEffect, useRef, useState } from 'react'
import { BehaviorSubject, combineLatest, Observable, PartialObserver, Subject } from 'rxjs'
import { v4 } from 'uuid'
import chalk from 'chalk'
import { LinkedNode } from 'mng-easy-util/cjs/algorithm/linked'
import { withLatestFrom } from 'rxjs/operators'

/**
 * @deprecated
 */
export namespace MngRxState {
  export const stateMap = new Map<string, BehaviorSubject<any>>()
  let currentState = new LinkedNode(new Map<string, any>())
  // control the state update process
  let timeTraveling = false
  const stateChangeFromUser$ = new BehaviorSubject<boolean>(true)
  const getAllStatesInMap = (): [string, BehaviorSubject<any>][] => {
    const entries = stateMap.entries()
    const result: [string, BehaviorSubject<any>][] = []
    for (;;) {
      const entry = entries.next()
      if (entry.done) break
      result.push(entry.value)
    }
    return result
  }
  // time travel!
  export const goPast = () => {
    if (currentState.prev) {
      currentState = currentState.prev
      stateChangeFromUser$.next(false)
    }
  }
  export const goFuture = () => {
    if (currentState.next) {
      currentState = currentState.next
      stateChangeFromUser$.next(false)
    }
  }
  // need call this function before you application started
  export const init = () => {
    const timeTravelStates = getAllStatesInMap()
    const stateObservables = timeTravelStates.map((state: [string, BehaviorSubject<any>]) => state[1])
    // automatically record the change of state
    combineLatest([...stateObservables, stateChangeFromUser$]).subscribe({
      next(values: any[]) {
        // if state is under time traveling, skip this observer
        if (timeTraveling) return
        // update currentState
        const newCurrentState = new LinkedNode(new Map<string, any>())
        const timeTravelValues = values.slice(0, values.length - 1)
        const stateChangeFromUser = values[values.length - 1] as boolean
        if (stateChangeFromUser) {
          timeTravelValues.forEach((value: any, index: number) => {
            newCurrentState.value.set(timeTravelStates[index][0], value)
          })
          currentState.addNode(newCurrentState)
          currentState = newCurrentState
        } else {
          // start time travel
          timeTraveling = true
          // state change from time travel
          const entries = currentState.value.entries()
          for (let index = 0; ; index++) {
            const entry = entries.next()
            if (entry.done) break
            const [key, value] = entry.value
            // update the changed state
            if (value !== values[index]) {
              stateMap.get(key)!.next(value)
            }
          }
          // after state change complete, make state change from user again
          stateChangeFromUser$.next(true)
          // end time travel
          timeTraveling = false
        }
      },
    })
  }
}

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

// @ts-ignore
export function createAtomState(options: {}): BehaviorSubject<undefined>
export function createAtomState(options: { key: string }): BehaviorSubject<undefined>
export function createAtomState<T>(options: { initState: T }): BehaviorSubject<T>
export function createAtomState<T>(options: { initState: T; key: string; useTimeTravel: boolean }): BehaviorSubject<T>
export function createAtomState<T>({
  initState,
  key,
  useTimeTravel = false,
}: {
  initState?: T
  key?: string
  useTimeTravel?: boolean
}) {
  const $ = new BehaviorSubject(initState)
  key = key ? key : v4()
  if (MngRxState.stateMap.has(key!)) console.log(chalk.yellowBright(`warning: the key[${key}] already exists!`))
  if (useTimeTravel) MngRxState.stateMap.set(key!, $)
  return $
}

type Handler<T> = () => Observable<T>

function isFunction(value: any): value is Function {
  return typeof value === 'function'
}

export function useObservable<T>(options: {
  handler: Handler<T>
}): [T | undefined, React.MutableRefObject<T | undefined>]
export function useObservable<T>(options: { handler: Handler<T>; initState: T }): [T, React.MutableRefObject<T>]

export function useObservable<T>({ handler, initState }: { handler: Handler<T>; initState?: T }) {
  const [state, setState, ref] = useStateRef<T | undefined>(initState !== undefined ? initState : undefined)
  const new$ = handler()
  useEffect(() => {
    const newSubs = new$.subscribe({
      next(value: T) {
        setState(value)
      },
    })
    return () => {
      newSubs.unsubscribe()
    }
  }, [])
  return [state, ref]
}
export function useConstant<T>(constructor: () => T): T
export function useConstant<T>(defaultValue: T): T
export function useConstant<T>(defaultValue: T | (() => T)) {
  const ref = useRef<T>()
  if (!ref.current) {
    ref.current = isFunction(defaultValue) ? defaultValue() : defaultValue
  }
  return ref.current
}

export type NotUndefined<T> = T extends undefined ? never : T

export function useEvent(): [Subject<undefined>, () => void]
export function useEvent<T, R = NotUndefined<T>>(): [Subject<R>, (e: R) => void]

export function useEvent<T>(): [Subject<T>, ((e: T) => void) | (() => void)] {
  const event$ = useConstant(new Subject<T>())
  const eventCallback = (e: T) => {
    // fix released/nullified synthetic event
    if ((e as any)?.persist) (e as any).persist()
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

export function useLocalObservable<T>(initState: T): [BehaviorSubject<T>, T, React.MutableRefObject<T>] {
  const stream$: BehaviorSubject<T> = useConstant(() =>
    createAtomState<T>({
      initState,
    }),
  )
  const [value, valueRef] = useObservable({
    handler: () => stream$.pipe(),
    initState,
  })
  return [stream$, value, valueRef]
}
