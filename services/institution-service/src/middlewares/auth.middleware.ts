import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import redis from '../config/redis';

const publicRoutes = [
  '/',
  '/health',
  '/api/v1/institutions/lab/register',
  '/api/v1/institutions/clinic/register',
  '/api/v1/institutions/lab/verify/:labid',
  '/api/v1/institutions/clinic/verify/:clinicid',
  '/api/v1/institutions/clinics',
  '/api/v1/institutions/labs',
  '/api/v1/institutions/admin/:adminUserId/institution',
  '/api/v1/institutions/clinic/:clinicId/staff',
  '/api/v1/institutions/lab/:labId/staff',
];

function isPublicRoute(path: string): boolean {
  console.log('🔍 [Auth Middleware] Checking if route is public:', path);
  const isPublic = publicRoutes.some((route) => {
    // Convert route with params (e.g., :doctorId) into regex
    const regex = new RegExp('^' + route.replace(/:[^\s/]+/g, '([^/]+)') + '$');
    const matches = regex.test(path);
    if (matches) {
      console.log(
        `✅ [Auth Middleware] Route ${path} matches public route: ${route}`,
      );
    }
    return matches;
  });

  if (!isPublic) {
    console.log(
      `❌ [Auth Middleware] Route ${path} is NOT public, requires authentication`,
    );
  }

  return isPublic;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  console.log('🔐 [Auth Middleware] verifyToken called');
  console.log('📍 [Auth Middleware] Request path:', req.path);
  console.log('📍 [Auth Middleware] Request URL:', req.url);
  console.log('📝 [Auth Middleware] Request headers:', req.headers);

  if (isPublicRoute(req.path)) {
    console.log('✅ [Auth Middleware] Public route, skipping auth check');
    return next();
  }

  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.error(
      '❌ [Auth Middleware] No token provided in authorization header',
    );
    return res.status(403).send({ message: 'invalid authorization header' });
  }

  console.log('🔑 [Auth Middleware] Token found, verifying...');

  jwt.verify(token, config.JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.error(
        '❌ [Auth Middleware] JWT verification failed:',
        err.message,
      );
      return res.status(401).send({ message: 'unauthorized' });
    }

    console.log('✅ [Auth Middleware] JWT verified, decoded:', decoded);

    const redisKey = `auth:${decoded.id}:${token}`;
    console.log('🔍 [Auth Middleware] Checking Redis for key:', redisKey);

    const redisToken = await redis.get(redisKey);

    if (!redisToken) {
      console.error('❌ [Auth Middleware] Token not found in Redis');
      return res.status(401).json({ message: 'unauthorized' });
    }

    console.log('✅ [Auth Middleware] Token validated successfully');

    req.userId = decoded.id;
    req.token = token;

    return next();
  });
};
