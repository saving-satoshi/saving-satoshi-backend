import path from 'path'

export const CONTAINER_WORKING_DIRECTORY = "/usr/app"
export const MAX_SCRIPT_EXECUTION_TIME = parseInt(process.env.MAX_SCRIPT_EXECUTION_TIME || "30000")
export const LANG_PATH = path.join(__dirname, 'languages')

export const LANGUAGE_CONFIG = {
  javascript: {
    baseImage: 'js-base',
    mainFile: 'index.js',
    command: ['node', 'index.js']
  },
  python: {
    baseImage: 'py-base',
    mainFile: 'main.py',
    command: ['python', 'main.py']
  }
}

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG
