import chalk from 'chalk'
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { LinkedNode } from 'mng-easy-util/cjs/algorithm/linked'
import { BehaviorSubject, combineLatest, Observable, PartialObserver, Subject } from 'rxjs'

class Mutables {
  static timeTraveling = false
  static initOnce = false
  static currentState = new LinkedNode(new Map<string, any>())
}

class Immutables {
  static stateMap = new Map<string, BehaviorSubject<any>>()
  // control the state update process
  static stateChangeFromUser$ = new BehaviorSubject<boolean>(true)
}

type AtomState<T> = {
  $: BehaviorSubject<T>
  default: T
}

function getAllStatesInMap(): [string, BehaviorSubject<any>][] {
  const entries = Immutables.stateMap.entries()
  const result: [string, BehaviorSubject<any>][] = []
  for (;;) {
    const entry = entries.next()
    if (entry.done) break
    result.push(entry.value)
  }
  return result
}

// time travel!
export function goPast() {
  if (Mutables.currentState.prev) {
    Mutables.currentState = Mutables.currentState.prev
    Immutables.stateChangeFromUser$.next(false)
  }
}
export function goFuture() {
  if (Mutables.currentState.next) {
    Mutables.currentState = Mutables.currentState.next
    Immutables.stateChangeFromUser$.next(false)
  }
}
// need call this function before you application started
export function init() {
  if (Mutables.initOnce) {
    console.log(chalk.yellowBright(`the init api can only be called once!`))
    return
  }
  Mutables.initOnce = true
  const timeTravelStates = getAllStatesInMap()

  const stateObservables = timeTravelStates.map((state: [string, BehaviorSubject<any>]) => state[1])
  // automatically record the change of state
  combineLatest([...stateObservables, Immutables.stateChangeFromUser$]).subscribe({
    next(values: any[]) {
      // if state is under time traveling, skip this observer
      if (Mutables.timeTraveling) return
      // update currentState
      const newCurrentState = new LinkedNode(new Map<string, any>())
      const timeTravelValues = values.slice(0, values.length - 1)
      const stateChangeFromUser = values[values.length - 1] as boolean
      if (stateChangeFromUser) {
        timeTravelValues.forEach((value: any, index: number) => {
          newCurrentState.value.set(timeTravelStates[index][0], value)
        })
        Mutables.currentState.addNode(newCurrentState)
        Mutables.currentState = newCurrentState
      } else {
        // start time travel
        Mutables.timeTraveling = true
        // state change from time travel
        const entries = Mutables.currentState.value.entries()
        for (let index = 0; ; index++) {
          const entry = entries.next()
          if (entry.done) break
          const [key, value] = entry.value
          // update the changed state
          if (value !== values[index]) {
            Immutables.stateMap.get(key)!.next(value)
          }
        }
        // after state change complete, make state change from user again
        Immutables.stateChangeFromUser$.next(true)
        // end time travel
        Mutables.timeTraveling = false
      }
    },
  })
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

function optionsIsUndefined(options: any): options is undefined {
  return options === undefined
}
function optionsIsKey(options: any): options is { key: string } {
  return options && options.key !== undefined && options.initState === undefined && options.useTimeTravel === undefined
}
function optionsIsInitState<T>(options: any): options is { initState: T } {
  return options && options.key === undefined && options.initState !== undefined && options.useTimeTravel === undefined
}
function optionsIsFull<T>(options: any): options is { initState: T; key: string; useTimeTravel: boolean } {
  return options && options.key !== undefined && options.initState !== undefined && options.useTimeTravel !== undefined
}
export function createAtomState(): AtomState<undefined>
export function createAtomState(options: { key: string }): AtomState<undefined>
export function createAtomState<T>(options: { initState: T }): AtomState<T>
export function createAtomState<T>(options: { initState: T; key: string; useTimeTravel: boolean }): AtomState<T>
export function createAtomState<T>(
  options?: { key: string } | { initState: T } | { initState: T; key: string; useTimeTravel: boolean },
): AtomState<undefined> | AtomState<T> {
  if (optionsIsUndefined(options)) {
    const $ = new BehaviorSubject(undefined)
    return {
      $: $,
      default: undefined,
    }
  } else if (optionsIsFull(options)) {
    const key = options.key
    const $ = new BehaviorSubject(options.initState)
    if (Immutables.stateMap.has(key)) console.log(chalk.yellowBright(`warning: the key[${key}] already exists!`))
    if (options.useTimeTravel) Immutables.stateMap.set(key, $)
    return {
      $: $,
      default: options.initState,
    }
  } else if (optionsIsKey(options)) {
    const $ = new BehaviorSubject(undefined)
    return {
      $: $,
      default: undefined,
    }
  } else {
    const $ = new BehaviorSubject(options.initState)
    return {
      $: $,
      default: options.initState,
    }
  }
}

function isFunction(value: any): value is Function {
  return typeof value === 'function'
}

export function useAtomState<T>(atomState: AtomState<T>): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>] {
  const [state, setState, ref] = useStateRef(atomState.default)
  const new$ = atomState.$.pipe()
  // use new$.next replace setState
  function setStateProxy(value: T | ((preState: T) => T)) {
    if (isFunction(value)) {
      const newValue = value(ref.current)
      atomState.$.next(newValue)
    } else {
      atomState.$.next(value)
    }
  }
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
  return [state, setStateProxy, ref]
}

export function useConstant<T>(constructor: () => T): T
export function useConstant<T>(defaultValue: T): T
export function useConstant<T>(defaultValue: T | (() => T)): T {
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
  const stream = useConstant(() =>
    createAtomState<T>({
      initState,
    }),
  )
  const [value, setValue, valueRef] = useAtomState(stream)
  return [stream.$, value, valueRef]
}
