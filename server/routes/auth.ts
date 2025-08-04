import express from "express";
import { Request, Response } from "express";

import { AuthDto, AuthRespnse } from "../models/auth";
import { createBadRequestError, createUnathorizedError } from "../models/error";
import { authenticateUser } from "../services/user";

const router = express.Router();

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as AuthDto;

  if (typeof username !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json(createBadRequestError("username and password are required"));
  }

  let response: AuthRespnse;
  try {
    response = authenticateUser(req.body as AuthDto);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return res.status(401).json(createUnathorizedError(message));
  }

  res.status(200).json(response);
});

export default router;
