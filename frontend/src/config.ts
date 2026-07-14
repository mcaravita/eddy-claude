const parsedHistorySize = Number(import.meta.env.VITE_HISTORY_SIZE)

export const HISTORY_SIZE =
  Number.isInteger(parsedHistorySize) && parsedHistorySize > 0 ? parsedHistorySize : 10
