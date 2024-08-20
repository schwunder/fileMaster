// @ts-ignore
import pipe from 'just-pipe';
import compose from 'just-compose';

export const isPromise = <T>(val: T | Promise<T>): val is Promise<T> => {
  return val && typeof (val as Promise<T>).then === 'function';
};

export const asyncPipe = <T>(
  initialValue: T,
  fns: ((arg: T) => T | Promise<T>)[]
): Promise<T> => {
  const asyncWrapper =
    (fn: (arg: T) => T | Promise<T>) =>
    async (arg: T): Promise<T> =>
      Promise.resolve(fn(arg));
  const wrappedFns = fns.map(asyncWrapper);
  return pipe(initialValue, ...wrappedFns);
};

export const asyncCompose = <T>(
  ...fns: ((arg: T) => T | Promise<T>)[]
): ((arg: T) => Promise<T>) => {
  const asyncWrapper =
    (fn: (arg: T) => T | Promise<T>) =>
    async (arg: T): Promise<T> =>
      Promise.resolve(fn(arg));
  const wrappedFns = fns.map(asyncWrapper);
  return compose(...(wrappedFns as [(arg: T) => Promise<T>]));
};
