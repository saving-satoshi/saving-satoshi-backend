import path from 'path'

export const SUPPORTED_LANGUAGES = ['javascript', 'python', 'go', 'rust', 'cpp']
export const CONTAINERS_TO_KEEP_ON = ['/saving-satoshi']
export const CONTAINERS_SCHEDULE =  parseInt(process.env.CONTAINER_TERMINATION_SCHEDULE || "10")
export const LANG_PATH = path.join(__dirname, 'languages')
