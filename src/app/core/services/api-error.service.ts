import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiProblem } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  message(error: unknown, fallback = 'No fue posible completar la operación.'): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el backend. Verifica que Spring Boot esté activo en el puerto 8080.';
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      const problem = error.error as ApiProblem | null;
      if (problem?.errors) {
        const validation = Object.values(problem.errors)[0];
        if (validation) return validation;
      }
      return problem?.detail || problem?.title || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }
}
