import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import redis from '../config/redis';

const publicRoutes = [
  '/api/v1/auth/patient/login',
  '/auth/patient/login',
  '/api/v1/auth/patient/register',
  '/auth/patient/register',
  '/api/v1/auth/medvaultpro/login',
  '/auth/medvaultpro/login',
  '/api/v1/auth/medvaultpro/doctor/register',
  '/auth/medvaultpro/doctor/register',
  '/api/v1/auth/medvaultpro/labassistant/register',
  '/auth/medvaultpro/labassistant/register',
  '/api/v1/auth/medvaultpro/medicalstaff/register',
  '/auth/medvaultpro/medicalstaff/register',
  '/api/v1/auth/medvaultpro/labadmin/register',
  '/auth/medvaultpro/labadmin/register',
  '/api/v1/auth/medvaultpro/clinicadmin/register',
  '/auth/medvaultpro/clinicadmin/register',
  '/api/v1/auth/medvaultpro/doctor/profile/:doctorId',
  '/auth/medvaultpro/doctor/profile/:doctorId',
  '/api/v1/auth/medvaultpro/doctor/patients',
  '/auth/medvaultpro/doctor/patients',
  '/api/v1/auth/medvaultpro/doctor/patient/:username',
  '/auth/medvaultpro/doctor/patient/:username',
  '/api/v1/auth/medvaultpro/doctor/:doctorUserid',
  '/auth/medvaultpro/doctor/:doctorUserid',
  '/api/v1/auth/medvaultpro/patient/:patientId/last-visited',
  '/auth/medvaultpro/patient/:patientId/last-visited',
  '/api/v1/auth/medvaultpro/patient/:patientId/condition',
  '/auth/medvaultpro/patient/:patientId/condition',
  '/api/v1/auth/medvaultpro/hospital/:hospitalId/doctors',
  '/auth/medvaultpro/hospital/:hospitalId/doctors',
  '/api/v1/auth/medvaultpro/hospital/:hospitalId/medical-staff',
  '/auth/medvaultpro/hospital/:hospitalId/medical-staff',
  '/api/v1/auth/medvaultpro/lab/:labId/assistants',
  '/auth/medvaultpro/lab/:labId/assistants',
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
  console.log('📝 [Auth Middleware] Request method:', req.method);

  if (isPublicRoute(req.path)) {
    console.log('✅ [Auth Middleware] Public route, skipping auth check');
    return next();
  }

  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.error(
      '❌ [Auth Middleware] No token provided in authorization header',
    );
    console.error('Authorization header:', req.headers['authorization']);
    return res.status(403).send({ message: 'invalid authorization header' });
  }

  console.log('🔑 [Auth Middleware] Token found, verifying...');

  jwt.verify(token, config.JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.error('❌ [Auth Middleware] JWT verification error:', err);
      return res.status(401).send({ message: 'unauthorized' });
    }

    console.log('✅ [Auth Middleware] JWT verified, decoded:', decoded);

    const redisKey = `auth:${decoded.id}:${token}`;
    console.log('🔍 [Auth Middleware] Checking Redis for key:', redisKey);

    const redisToken = await redis.get(redisKey);

    if (!redisToken) {
      console.error('❌ [Auth Middleware] Token not found in Redis:', redisKey);
      return res
        .status(401)
        .json({ message: 'unauthorized. Redis Token not found' });
    }

    console.log('✅ [Auth Middleware] Token validated successfully in Redis');

    req.userId = decoded.id;
    req.token = token;

    return next();
  });
};
