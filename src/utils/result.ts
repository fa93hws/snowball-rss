export namespace Result {
  export type Ok<V> = {
    isOk: true;
    value: V;
  };
  export type Err<E = Error> = {
    isOk: false;
    error: E;
  };
  export type T<V, E = Error> = Ok<V> | Err<E>;

  export function ok<V>(value: V): Ok<V> {
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

  export function unwrap<V>(result: T<V, any>): V {
    if (result.isOk) {
      return result.value;
    }
    if (typeof result.error === 'string') {
      throw new Error(result.error);
    }
    throw result.error;
  }
}
