import path from 'path'

// In alphabetical order

// Names of the base Docker images
export const BASE_IMAGE_NAMES = {
  javascript: 'js-base',
  python: 'py-base'
}

export const CONTAINERS_TO_KEEP_ON = ['/saving-satoshi']
export const CONTAINERS_SCHEDULE =  parseInt(process.env.CONTAINER_TERMINATION_SCHEDULE || "10")

// From the base image Dockerfile
export const CONTAINER_WORKING_DIRECTORY = "/usr/app"

export const LANG_PATH = path.join(__dirname, 'languages')

export const SUPPORTED_LANGUAGES = {
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  cpp: 'cpp'
}

// Names of the files that have user code
export const USER_CODE_FILES = {
  python: ['main.py'],
  javascript: ['index.js'],
  rust: ['src/main.rs', 'Cargo.toml'],
  go: ['main.go', 'go.mod'],
  cpp: ['main.cpp'],
}