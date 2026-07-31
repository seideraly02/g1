import { mockForecastConfiguration } from './forecastConfig'
import { evaluateForecastEligibility } from './forecastEngine'
import { createLocalForecastRepository } from './localForecastRepository'
import { createForecastScreenModel } from './forecastPresentation'
import { getSessionRepository } from '../session/sessionApplication'
import type { ForecastRepository } from './forecastRepository'
import type { ForecastConfiguration, ForecastScreenModel } from './types'

const defaultForecastRepository = createLocalForecastRepository(getSessionRepository())

export interface ForecastApplicationDependencies {
  repository?: ForecastRepository
  configuration?: ForecastConfiguration
  asOf?: Date
}

export function getForecastScreenModel(
  dependencies: ForecastApplicationDependencies = {},
): ForecastScreenModel {
  const repository = dependencies.repository ?? defaultForecastRepository
  const assessment = evaluateForecastEligibility(
    repository.getForecastInput(),
    dependencies.configuration ?? mockForecastConfiguration,
    dependencies.asOf ?? new Date(),
  )

  return createForecastScreenModel(assessment)
}
