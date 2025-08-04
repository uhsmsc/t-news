import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import { getEnv } from "../utils/config";
import { createUnathorizedError } from "../models/error";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const JWT_SECRET = getEnv("JWT_SECRET");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(createUnathorizedError());
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || typeof decoded !== "object") {
      return res.status(401).json(createUnathorizedError());
    }

    const userId = (decoded as JwtPayload).sub!;

    (req as AuthenticatedRequest).user = { userId };
    next();
  });
}
