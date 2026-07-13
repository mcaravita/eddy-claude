export interface AskResponse {
  id: string
  text: string
}

export interface Exchange {
  exchangeId: number
  question: string
  response: AskResponse
}
