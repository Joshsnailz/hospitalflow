import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../audit/audit.service';

const SKIP_PATHS = ['/health', '/audit', '/favicon'];
const METHOD_TO_ACTION: Record<string, string> = {
  GET: 'READ',
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function extractResource(path: string): string {
  const segments = path.replace(/^\/api\/v\d+\//, '/').split('/').filter(Boolean);
  if (segments.length === 0) return 'system';
  const top = segments[0];
  if (top === 'clinical' && segments[1]) return segments[1];
  return top;
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.originalUrl.split('?')[0];

    if (SKIP_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const jwtPayload = decodeJwtPayload(token);

    res.on('finish', () => {
      const action = METHOD_TO_ACTION[req.method] || 'READ';
      const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';
      const resource = extractResource(path);
      const requestId = req.headers['x-request-id'] as string;
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress;

      this.auditService
        .createLog({
          userId: jwtPayload?.sub,
          userEmail: jwtPayload?.email,
          userRole: jwtPayload?.role,
          action,
          resource,
          status,
          ipAddress,
          userAgent: req.get('user-agent'),
          description: `${req.method} ${path}`,
          requestId,
          serviceName: 'api-gateway',
        })
        .catch(() => {});
    });

    next();
  }
}
