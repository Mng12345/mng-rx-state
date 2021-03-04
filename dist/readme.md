## use rxjs to make a state manager for react hooks
#### example

```typescript
import React, { MouseEventHandler, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createAtomState, useEvent, useObservable, useSubscribe } from '../src/mng-rx'

type Person = {
  name: string
  age: number
}

const defaultHusband = {
  name: 'zm',
  age: 27,
}

const defaultWife = {
  name: 'zl',
  age: 28,
}

const husband$ = createAtomState<Person>(defaultHusband)
const wife$ = createAtomState<Person>(defaultWife)

function AllAge() {
  const [husband, husbandRef] = useObservable({
    handler: () => husband$.pipe(),
    initState: defaultHusband,
  })
  const [wife, wifeRef] = useObservable({
    handler: () => wife$.pipe(),
    initState: defaultWife,
  })

  const [addAllAge$, addAllAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()
  useSubscribe(addAllAge$, {
    next() {
      husband$.next({
        ...husbandRef.current,
        age: husbandRef.current.age + 1,
      })
      wife$.next({
        ...wifeRef.current,
        age: wifeRef.current.age + 1,
      })
    },
  })

  return (
    <>
      all age: {husband.age + wife.age}
      <hr />
      <button onClick={addAllAge}>add all age</button>
    </>
)
}

function App() {
  const [husband, husbandRef] = useObservable({
    handler: () => husband$.pipe(),
    initState: defaultHusband,
  })
  const [wife, wifeRef] = useObservable({
    handler: () => wife$.pipe(),
    initState: defaultWife,
  })

  const [addHusbandAge$, addHusbandAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()
  const [addWifeAge$, addWifeAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()

  useSubscribe(addHusbandAge$, {
    next() {
      husband$.next({
        ...husbandRef.current,
        age: husbandRef.current.age + 1,
      })
    },
  })

  useSubscribe(addWifeAge$, {
    next() {
      wife$.next({
        ...wifeRef.current,
        age: wifeRef.current.age + 1,
      })
    },
  })

  return (
    <div>
      husband: {husband.name}
      <hr />
      age: {husband.age}
      <hr />
      wife: {wife.name}
      <hr />
      age: {wife.age}
      <hr />
      <button
        onClick={addHusbandAge}
        style={{
          marginRight: 12,
        }}
      >
        add husband age
      </button>
      <button onClick={addWifeAge}>add wife age</button>
      <hr />
      <AllAge />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))


```
