import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiProblem } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  message(error: unknown, fallback = 'No fue posible completar la operación.'): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el backend. Verifica que Spring Boot esté activo en el puerto 8080.';
      const problem = this.problem(error.error);
      if (problem?.errors) {
        const validation = Object.values(problem.errors)[0];
        if (validation) return validation;
      }
      if (problem?.detail || problem?.title) return problem.detail || problem.title || fallback;
      if (this.isHtml(error.error)) {
        return 'El servidor devolvió una respuesta inválida. Verifica que Angular use el proxy local y que Spring Boot esté activo.';
      }
      return fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }

  private problem(value: unknown): ApiProblem | null {
    if (value && typeof value === 'object') return value as ApiProblem;
    if (typeof value !== 'string' || this.isHtml(value)) return null;
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as ApiProblem : null;
    } catch {
      return null;
    }
  }

  private isHtml(value: unknown): boolean {
    return typeof value === 'string' && /<\s*(?:!doctype|html|body|pre)\b|Cannot\s+(?:GET|POST|PUT|PATCH|DELETE)\s+\/api/i.test(value);
  }
}
