import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// jsdom has no object URLs; saveFile needs them.
URL.createObjectURL = () => 'blob:test'
URL.revokeObjectURL = () => {}
if (typeof window !== 'undefined') window.scrollTo = () => {}
