import { StateField, StateEffect } from '@codemirror/state'

export const toggleSourceMode = StateEffect.define<boolean>()

export const sourceModeState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(toggleSourceMode)) return e.value
    }
    return value
  },
})
