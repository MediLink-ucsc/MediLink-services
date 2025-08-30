import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import redis from "../config/redis";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    labId?: string;
    hospitalId?: string;
    role?: string;
  };
}

const publicRoutes = ["/", "/health"];

export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).send({ message: "invalid authorization header" });
  }

  jwt.verify(token, config.JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }

    const redisKey = `auth:${decoded.id}:${token}`;
    const redisToken = await redis.get(redisKey);

    if (!redisToken) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // Add user information to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      labId: decoded.labId || decoded.hospitalId?.toString(), // Use hospitalId as labId if labId is not present
      hospitalId: decoded.hospitalId?.toString(),
      role: decoded.role,
    };

    return next();
  });
};

export { AuthenticatedRequest };
