import path from 'path'

// In alphabetical order

// Names of the base Docker images
export const BASE_IMAGES = {
  javascript: 'js-base',
  python: 'py-base'
}

export const LANG_PATH = path.join(__dirname, 'languages')

export const SUPPORTED_LANGUAGES = ['javascript', 'python', 'go', 'rust', 'cpp']

// Names of the files that have user code
export const USER_CODE_FILES = {
  python: ['main.py'],
  javascript: ['index.js'],
  rust: ['src/main.rs', 'Cargo.toml'],
  go: ['main.go', 'go.mod'],
  cpp: ['main.cpp'],
}