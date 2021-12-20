export namespace Result {
  export type Ok<T> = {
    isOk: true;
    value: T;
  };
  export type Err<E = string> = {
    isOk: false;
    error: E;
  };
  export type Result<T, E = string> = Ok<T> | Err<E>;

  export function ok<T>(value: T): Ok<T> {
    return {
      isOk: true,
      value,
    };
  }

  export function err<E>(error: E): Err<E> {
    return {
      isOk: false,
      error,
    };
  }

  export function unwrap<T>(result: Result<T, Error | string>): T {
    if (result.isOk) {
      return result.value;
    }
    if (typeof result.error === 'string') {
      throw new Error(result.error);
    }
    throw result.error;
  }
}
