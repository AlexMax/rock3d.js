module.exports = {
    roots: [
        "<rootDir>/__tests__/",
        "<rootDir>/src/" // No tests, but needed for coverage.
    ],
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    setupFilesAfterEnv: [
        "<rootDir>/__tests__/matchers.ts"
    ],
    testMatch: [
        "**/__tests__/**/*test.[jt]s?(x)"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.ts",
    ],
};
