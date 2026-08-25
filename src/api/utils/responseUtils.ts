import { ApiResponse, ApiErrorCode } from '../types/apiTypes';

export const responseUtils = {
  /**
   * Crea una respuesta estandarizada de éxito
   */
  exito<T>(data: T, mensaje = 'Operación ejecutada exitosamente', status = 200): { status: number; body: ApiResponse<T> } {
    return {
      status,
      body: {
        exito: true,
        codigoEstado: status,
        mensaje,
        timestamp: new Date().toISOString(),
        data
      }
    };
  },

  /**
   * Crea una respuesta estandarizada de error con código HTTP exacto y código de error del dominio
   */
  error(
    codigoError: ApiErrorCode,
    mensaje: string,
    status = 400,
    data?: any
  ): { status: number; body: ApiResponse } {
    return {
      status,
      body: {
        exito: false,
        codigoEstado: status,
        codigoError,
        mensaje,
        timestamp: new Date().toISOString(),
        ...(data ? { data } : {})
      }
    };
  }
};
