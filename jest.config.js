// jest.config.js
module.exports = {
    testEnvironment: 'node',               // we're testing on Node.js
    testTimeout: 30000,                    // 30 seconds (CI can be slow)
    verbose: true,                         // more detailed console output
    forceExit: true,                       // exit after tests finish
    setupFilesAfterEnv: ['./tests/setup.js'],   // runs before all test suites

};