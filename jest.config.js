module.exports = {
    roots: [
        "<rootDir>/tests/",
        "<rootDir>/src/" // No tests, but needed for coverage.
    ],
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    setupFilesAfterEnv: [
        "<rootDir>/tests/matchers.ts"
    ],
    testMatch: [
        "**/tests/**/*test.[jt]s?(x)"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.ts",
    ],
};
