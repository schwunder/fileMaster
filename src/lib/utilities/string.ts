export const truncateLog = (message: string, maxLength: number = 500): string => {
	return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
};
