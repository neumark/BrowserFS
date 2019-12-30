generating test runner:

npx npm-run-all build:scripts script:make_test_launcher

in test/harness/setup.ts, replace
__numWaiting with (<any> global).__numWaiting
