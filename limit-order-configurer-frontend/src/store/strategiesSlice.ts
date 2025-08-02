import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FillEvent {
  id: string
  timestamp: string
  fillPrice: number
  amount: number
  cumulativeAmount: number
}

export interface Strategy {
  id: string
  name: string
  type: 'TWAP' | 'RANGE_LIMIT' | 'DUTCH_AUCTION'
  status: 'ACTIVE' | 'DONE' | 'CANCELLED'
  createdAt: string
  orderParams: {
    makerToken: string
    takerToken: string
    makerAmount: string
  }
  strategyParams: any // Strategy-specific parameters
  fillEvents: FillEvent[]
  totalFilled: number
  averageFillPrice: number
  order?: any
  signature?: string
}

interface StrategiesState {
  strategies: Strategy[]
}

const initialState: StrategiesState = {
  strategies: []
}

const strategiesSlice = createSlice({
  name: 'strategies',
  initialState,
  reducers: {
    addStrategy: (state, action: PayloadAction<Omit<Strategy, 'id' | 'createdAt' | 'fillEvents' | 'totalFilled' | 'averageFillPrice'>>) => {
      const newStrategy: Strategy = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        fillEvents: [],
        totalFilled: 0,
        averageFillPrice: 0,
      }
      state.strategies.push(newStrategy)
    },
    updateStrategyStatus: (state, action: PayloadAction<{ id: string; status: Strategy['status'] }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.id)
      if (strategy) {
        strategy.status = action.payload.status
      }
    },
    addFillEvent: (state, action: PayloadAction<{ strategyId: string; fillEvent: Omit<FillEvent, 'id'> }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.strategyId)
      if (strategy) {
        const newFillEvent: FillEvent = {
          ...action.payload.fillEvent,
          id: Date.now().toString(),
        }
        strategy.fillEvents.push(newFillEvent)
        strategy.totalFilled = newFillEvent.cumulativeAmount
        
        // Calculate average fill price
        const totalValue = strategy.fillEvents.reduce((sum, event) => sum + (event.fillPrice * event.amount), 0)
        const totalAmount = strategy.fillEvents.reduce((sum, event) => sum + event.amount, 0)
        strategy.averageFillPrice = totalAmount > 0 ? totalValue / totalAmount : 0
      }
    },
  },
})

export const { addStrategy, updateStrategyStatus, addFillEvent } = strategiesSlice.actions
export default strategiesSlice.reducer