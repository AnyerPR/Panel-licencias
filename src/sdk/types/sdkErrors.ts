/**
 * Error personalizado estructurado para fallos en el SDK de Licencias
 */
export class SDKLicenseError extends Error {
  public readonly codigoError: string;
  public readonly codigoEstado: number;
  public readonly timestamp: string;
  public readonly detalles?: any;

  constructor(
    mensaje: string,
    codigoError = 'ERROR_SDK',
    codigoEstado = 500,
    detalles?: any
  ) {
    super(mensaje);
    this.name = 'SDKLicenseError';
    this.codigoError = codigoError;
    this.codigoEstado = codigoEstado;
    this.timestamp = new Date().toISOString();
    this.detalles = detalles;

    // Restaurar prototipo en entornos transpilados
    Object.setPrototypeOf(this, SDKLicenseError.prototype);
  }
}
