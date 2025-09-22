import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/src/lib/$1',
    '^middleware$': '<rootDir>/src/middleware',
    '^middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^models/(.*)$': '<rootDir>/src/models/$1',
    '^routes/(.*)$': '<rootDir>/src/routes/$1',
    '^types/(.*)$': '<rootDir>/src/types/$1',
    '^config$': '<rootDir>/src/config'
  },
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config; 