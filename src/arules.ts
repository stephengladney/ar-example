export const triggers = {
  person: ["When a person is created", "When a person is deleted"],
} as const

export type SafeTrigger<
  T extends Record<string, readonly string[]>,
  U extends keyof T
> = T[U][number]

export const params = {
  person: ["name", "age", "hometown"],
} as const
