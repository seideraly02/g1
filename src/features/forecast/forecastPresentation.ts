import type {
  ForecastAssessment,
  ForecastScore,
  ForecastScoreDisplay,
  ForecastScreenModel,
} from './types'

function createScoreDisplay(score: ForecastScore): ForecastScoreDisplay {
  return {
    label: 'Болжамды аралық',
    value: `${score.lowerBound}–${score.upperBound} / ${score.totalMaximumScore} балл`,
    detail: `Орталық баға: ${score.predictedScore} балл`,
  }
}

function createInsufficientDataModel(
  assessment: Extract<ForecastAssessment, { status: 'insufficient-data' }>,
): ForecastScreenModel {
  if (assessment.reason === 'guest-diagnostic') {
    return {
      status: assessment.status,
      eyebrow: 'Дерек жеткіліксіз',
      title: 'Болжамға дерек жеткіліксіз',
      description: `Қысқа диагностика тек бастапқы бағыт береді. ҰБТ болжамы үшін кемінде ${assessment.requiredAnswerCount} жаттығу жауабы керек.`,
      note: 'Бұл ҰБТ нәтижесінің кепілі емес.',
      actionLabel: 'Жаттығуды бастау',
    }
  }

  if (assessment.reason === 'subject-selection') {
    return {
      status: assessment.status,
      eyebrow: 'Дерек жеткіліксіз',
      title: 'Пәндерді нақтылау керек',
      description: 'Болжам үшін таңдаған пәндеріңді белгілеп, солар бойынша жауап жина.',
      note: 'Жаттығу нәтижелері көбейген сайын бағалау нақтыланады.',
      actionLabel: 'Жаттығуды бастау',
    }
  }

  return {
    status: assessment.status,
    eyebrow: 'Дерек жеткіліксіз',
    title: 'Болжамға дерек жеткіліксіз',
    description: `ҰБТ болжамын шығару үшін кемінде ${assessment.requiredAnswerCount} сұраққа жауап бер.`,
    note: 'Қысқа диагностика тек бастапқы бағыт береді. Ол ҰБТ нәтижесін дәл болжамайды.',
    actionLabel: 'Жаттығуды бастау',
  }
}

export function createForecastScreenModel(assessment: ForecastAssessment): ForecastScreenModel {
  switch (assessment.status) {
    case 'invalid-input':
      return {
        status: assessment.status,
        eyebrow: 'Деректі жаңарту керек',
        title: 'Болжам әзірге қолжетімсіз',
        description: 'Болжамды көрсету үшін оқу деректерін жаңарту керек.',
        note: 'Жаттығуды жалғастырған соң бағалау қайта есептеледі.',
        actionLabel: 'Жаттығуды бастау',
      }
    case 'insufficient-data':
      return createInsufficientDataModel(assessment)
    case 'preliminary':
      return {
        status: assessment.status,
        eyebrow: 'Алдын ала бағалау',
        title: assessment.score ? 'ҰБТ болжамы әзірге кең аралықта' : 'Болжам әзірге толық емес',
        description: assessment.score
          ? 'Бағалау соңғы жаттығу жауаптарыңа сүйенеді. Дерек көбейген сайын аралық тарылады.'
          : 'Жауаптар жиналып жатыр. Әзірге пәндердің әрқайсысы бойынша дерек жеткіліксіз.',
        note: 'Бұл ҰБТ нәтижесінің кепілі емес.',
        actionLabel: 'Жаттығуды жалғастыру',
        ...(assessment.score ? { score: createScoreDisplay(assessment.score) } : {}),
      }
    case 'stable':
      return {
        status: assessment.status,
        eyebrow: 'Дерек жеткілікті',
        title: 'ҰБТ болжамы',
        description: 'Бағалау жаттығудағы соңғы жауаптарыңа сүйенеді.',
        note: 'Бұл оқу бағытын көруге көмектеседі, бірақ ҰБТ нәтижесіне кепілдік бермейді.',
        actionLabel: 'Жаттығуды жалғастыру',
        score: createScoreDisplay(assessment.score),
      }
  }
}
