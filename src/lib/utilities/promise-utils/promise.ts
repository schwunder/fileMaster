export const isPromise = <T>(val: T | Promise<T>): val is Promise<T> => {
	return val && typeof (val as Promise<T>).then === 'function';
};

export const pipe = <T>(initialValue: T, fns: ((arg: T) => T | Promise<T>)[]): T | Promise<T> => {
	return fns.reduce<Promise<T> | T>((acc, fn) => {
		return isPromise(acc) ? acc.then(fn) : fn(acc);
	}, initialValue);
};
