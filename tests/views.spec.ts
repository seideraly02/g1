import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const viewsDirectory = resolve(process.cwd(), 'src/views')

describe('Qadam mobile screens', () => {
  it('contains all 19 reference screens as TypeScript script-setup components', () => {
    const files = readdirSync(viewsDirectory)
      .filter((file) => file.endsWith('.vue'))
      .sort()

    expect(files).toHaveLength(19)

    for (const file of files) {
      const source = readFileSync(resolve(viewsDirectory, file), 'utf8')
      const result = parse(source, { filename: file })

      expect(result.errors, file).toEqual([])
      expect(result.descriptor.scriptSetup?.lang, file).toBe('ts')
      expect(source, `${file} must use global styles and Tailwind`).not.toContain('<style')
    }
  })

  it('does not ship the Russian locale from the reference mockup', () => {
    const sources = readdirSync(viewsDirectory)
      .filter((file) => file.endsWith('.vue'))
      .map((file) => readFileSync(resolve(viewsDirectory, file), 'utf8'))
      .join('\n')

    for (const russianCopy of ['Русский', 'Выбери предмет', 'Продолжить', 'Сохранение прогресса']) {
      expect(sources).not.toContain(russianCopy)
    }
  })
})
