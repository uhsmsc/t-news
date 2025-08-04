export interface ErrorResponse {
  code: number;
  message: string;
}

export function createUnathorizedError(
  message = "Unauthorized",
): ErrorResponse {
  return {
    code: 401,
    message,
  };
}

export function createBadRequestError(message = "Bad request"): ErrorResponse {
  return {
    code: 400,
    message,
  };
}

export function createNotFoundError(
  message = "Entity not found",
): ErrorResponse {
  return {
    code: 404,
    message,
  };
}

export function createForbittenMessage(message = "Forbitten"): ErrorResponse {
  return {
    code: 403,
    message,
  };
}
