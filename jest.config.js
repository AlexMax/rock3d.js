module.exports = {
    roots: [
        "<rootDir>/__tests__/",
        "<rootDir>/src/" // No tests, but needed for coverage.
    ],
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.ts",
    ]
};
