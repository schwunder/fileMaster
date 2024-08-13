import axios, { AxiosError } from 'axios';

// Check if the error is a rate limit error (HTTP 429)
const isRateLimitError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error) && error.response?.status === 429;
};

// Wait for a specified delay time
const waitFor = (delayTime: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delayTime));
};

// Determine if a retry should be attempted
const shouldRetry = (
  error: unknown,
  retries: number,
  maxRetries: number
): boolean => {
  return isRateLimitError(error) && retries < maxRetries;
};

// Calculate the delay time for the next retry attempt
const retryDelay = (delayTime: number): number => {
  return delayTime * 2; // Double the delay time for the next attempt
};

// Increment the retry count
const incrementRetries = (retries: number): number => {
  return retries + 1; // Increment the retry count
};

// Execute the provided function with the given arguments
const executeFunction = async <T>(
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[]
): Promise<T> => {
  return await func(...args);
};

// Handle errors and decide whether to retry
const handleError = async <T>(
  error: unknown,
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  retries: number,
  maxRetries: number,
  delayTime: number
): Promise<T> => {
  if (shouldRetry(error, retries, maxRetries)) {
    await waitFor(delayTime);
    retries = incrementRetries(retries); // Increment the retry count
    delayTime = retryDelay(delayTime); // Update the delay time for the next attempt
    return handleRetry(func, args, maxRetries, delayTime, retries); // Retry the function
  }
  throw error; // Rethrow if it's not a rate limit error
};

// Handle execution errors by delegating to handleError
const handleExecutionError = async <T>(
  error: unknown,
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  retries: number,
  maxRetries: number,
  delayTime: number
): Promise<T> => {
  return await handleError(error, func, args, retries, maxRetries, delayTime);
};

// Attempt to execute the function and handle errors
const attemptExecution = async <T>(
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  retries: number,
  maxRetries: number,
  delayTime: number
): Promise<T> => {
  return executeFunction(func, args).catch((error) =>
    handleExecutionError(error, func, args, retries, maxRetries, delayTime)
  );
};

// Handle retries for the function execution
const handleRetry = async <T>(
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  maxRetries: number,
  initialDelay: number,
  retries: number = 0 // Default retries to 0
): Promise<T> => {
  const delayTime = initialDelay;

  while (retries < maxRetries) {
    return attemptExecution(func, args, retries, maxRetries, delayTime);
  }
  throw new Error('Max retries exceeded'); // Throw an error if max retries are reached
};

// Export the main function to execute with retry logic
export const executeWithRetry = async <T>(
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  return handleRetry(func, args, maxRetries, initialDelay);
};
