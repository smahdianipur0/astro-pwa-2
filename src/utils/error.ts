import { TRPCError } from '@trpc/server';

export class OkImpl<T> {
    readonly ok: true = true;
    readonly err: false = false;
    readonly value: T;

    constructor(value: T) {
        this.value = value;
    }
}

export const Ok = OkImpl as typeof OkImpl & (<T>(value: T) => OkImpl<T>);
export type Ok<T> = OkImpl<T>;

export class ErrImpl<E> {
    readonly ok: false = false;
    readonly err: true = true;
    readonly value: E;

    constructor(value: E) {
        this.value = value;
    }
}

export const Err = ErrImpl as typeof ErrImpl & (<E>(err: E) => ErrImpl<E>);
export type Err<E> = ErrImpl<E>;
export type Result<T, E> = Ok<T> | Err<E>;



export class AppError extends Error {

  public readonly cause?: unknown;

  constructor(message: string, options?: { cause: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    
    if (this.cause instanceof Error) {
        this.stack = this.stack + '\nCaused by: ' + this.cause.stack;
    }
  }
}

// Specific error types for different failure domains.
export class DBConnectionError extends AppError {}
export class DBOperationError extends AppError {}
export class validationError extends AppError {}
export class AuthenticationError extends AppError {}
export class NotFoundError extends AppError {}



export function handleTRPCError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof AuthenticationError) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: error.message,
      cause: error,
    });
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    cause: error,
  });
}
