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

  it('never exposes an HTML proxy error to the user', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: '<!DOCTYPE html><html><body><pre>Cannot POST /api/v1/auth/login</pre></body></html>'
    });

    const message = service.message(error, 'No fue posible iniciar sesión.');

    expect(message).toContain('respuesta inválida');
    expect(message).not.toContain('<html>');
    expect(message).not.toContain('Cannot POST');
  });

  it('parses ProblemDetail JSON received as text', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: '{"detail":"Credenciales incorrectas.","code":"UNAUTHORIZED"}'
    });

    expect(service.message(error)).toBe('Credenciales incorrectas.');
  });

  it('uses the supplied fallback for unknown failures', () => {
    expect(service.message(null, 'Error controlado')).toBe('Error controlado');
  });
});
