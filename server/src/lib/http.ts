import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncRoute = <TReq extends Request>(handler: AsyncHandler<TReq>): RequestHandler =>
  (req, res, next) => {
    void handler(req as TReq, res, next).catch(next);
  };

export function jsonError(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = typeof (error as { status?: unknown }).status === 'number'
    ? (error as { status: number }).status
    : 500;
  const message = error instanceof Error ? error.message : 'Server error';
  res.status(status).json({ error: message });
}
