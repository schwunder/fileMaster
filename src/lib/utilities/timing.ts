import axios, { AxiosError } from 'axios';

export const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retryWithExponentialBackoff = async <T>(
	func: (...args: unknown[]) => Promise<T>,
	args: unknown[],
	maxRetries: number = 3,
	initialDelay: number = 2000
): Promise<T> => {
	let retries = 0;
	let delayTime = initialDelay;

	while (retries < maxRetries) {
		try {
			return await func(...args);
		} catch (error) {
			if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 429) {
				retries++;
				await delay(delayTime);
				delayTime *= 2;
			} else {
				throw error;
			}
		}
	}
	throw new Error('Max retries exceeded');
};
