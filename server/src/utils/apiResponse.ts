import { Response } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res: Response, data: any, message = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res: Response, data: any[], meta: PaginationMeta, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: meta,
    });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode = 500, errors?: any[]) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}

export default ApiResponse;
