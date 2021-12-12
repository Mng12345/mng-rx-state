import React, { MouseEventHandler, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as mngrx from '../src'
import { createAtomState, useEvent, useAtomState, useSubscribe, travelMachineState } from '../src'
import { sleep } from 'mng-easy-util/cjs/sleep'

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

const husband$ = createAtomState<Person>({
  initState: defaultHusband,
  key: 'husband$',
  useTimeTravel: true,
})
const wife$ = createAtomState<Person>({
  initState: defaultWife,
  key: 'wife$',
  useTimeTravel: true,
})

function AllAge({ voidClick }: { voidClick: () => void }) {
  const [husband, setHusband, husbandRef] = useAtomState(husband$)
  const [wife, setWife, wifeRef] = useAtomState(wife$)

  const [addAllAge$, addAllAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()
  useSubscribe(addAllAge$, {
    next(e) {
      husband$.$.next({
        ...husbandRef.current,
        age: husbandRef.current.age + 1,
      })
      wife$.$.next({
        ...wifeRef.current,
        age: wifeRef.current.age + 1,
      })
      voidClick()
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
  const [husband, setHusband, husbandRef] = useAtomState(husband$)
  const [wife, setWife, wifeRef] = useAtomState(wife$)
  const [travelMachine, setTravelMachine, travelMachineRef] = useAtomState(travelMachineState)

  const [addHusbandAge$, addHusbandAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()
  const [addWifeAge$, addWifeAge] = useEvent<React.MouseEvent<HTMLButtonElement>>()
  const [voidClick$, voidClick] = useEvent()
  useSubscribe(voidClick$, {
    next() {
      console.log(`called voidClick callback`)
    },
  })

  useSubscribe(addHusbandAge$, {
    next() {
      husband$.$.next({
        ...husbandRef.current,
        age: husbandRef.current.age + 1,
      })
    },
  })

  useSubscribe(addWifeAge$, {
    next() {
      wife$.$.next({
        ...wifeRef.current,
        age: wifeRef.current.age + 1,
      })
    },
  })

  useEffect(() => {
    // init the state manager
    mngrx.init()
  }, [])

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
      <AllAge voidClick={voidClick} />
      <hr />
      <div
        style={{
          display: 'flex',
          marginTop: 10,
        }}
      >
        <button
          onClick={() => mngrx.goPast()}
          style={{ marginRight: 10, cursor: travelMachine.canGoToPast ? 'pointer' : 'not-allowed' }}
        >
          prev
        </button>
        <button
          onClick={() => mngrx.goFuture()}
          style={{ marginRight: 10, cursor: travelMachine.canGoToFuture ? 'pointer' : 'not-allowed' }}
        >
          next
        </button>
        <button onClick={() => mngrx.snapshot()} style={{ cursor: 'pointer' }}>
          snapshot
        </button>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
