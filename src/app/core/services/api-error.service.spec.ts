import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  const service = new ApiErrorService();

  it('returns the message from a regular Error', () => {
    expect(service.message(new Error('Detalle técnico'))).toBe('Detalle técnico');
  });

  it('returns the first validation error received from the API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: { email: 'El correo no es válido.' } }
    });

    expect(service.message(error)).toBe('El correo no es válido.');
  });

  it('returns a connection message when the backend is unavailable', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(service.message(error)).toContain('No se pudo conectar con el backend');
  });

  it('uses the supplied fallback for unknown failures', () => {
    expect(service.message(null, 'Error controlado')).toBe('Error controlado');
  });
});
