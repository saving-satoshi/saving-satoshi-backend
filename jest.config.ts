import type { Config } from '@jest/types';

const moduleNameMapper = {
  '^lib/(.*)$': '<rootDir>/src/lib/$1',
  '^middleware$': '<rootDir>/src/middleware',
  '^middleware/(.*)$': '<rootDir>/src/middleware/$1',
  '^models/(.*)$': '<rootDir>/src/models/$1',
  '^routes/(.*)$': '<rootDir>/src/routes/$1',
  '^types/(.*)$': '<rootDir>/src/types/$1',
  '^config$': '<rootDir>/src/config'
};

const config: Config.InitialOptions = {
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      moduleNameMapper,
    },
  ],
};

export default config;
