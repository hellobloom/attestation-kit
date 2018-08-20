/**
 * Always mock out delayedJobs so we never run into confusing issues
 * with redis failing to connect because the queue module was transitively
 * required.
 */
jest.mock('@shared/jobs/boss', () => ({publish: jest.fn()}))
