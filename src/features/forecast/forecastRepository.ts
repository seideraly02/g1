import type { ForecastInput } from './types'

export interface ForecastRepository {
  getForecastInput(): ForecastInput
}
