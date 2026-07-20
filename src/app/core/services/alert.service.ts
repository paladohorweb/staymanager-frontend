import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  success(title: string, text?: string): Promise<unknown> {
    return Swal.fire({ icon: 'success', title, text, confirmButtonText: 'Aceptar', customClass: { confirmButton: 'btn btn-primary px-4' }, buttonsStyling: false });
  }

  error(title: string, text?: string): Promise<unknown> {
    return Swal.fire({ icon: 'error', title, text, confirmButtonText: 'Entendido', customClass: { confirmButton: 'btn btn-primary px-4' }, buttonsStyling: false });
  }

  info(title: string, text?: string, icon: SweetAlertIcon = 'info'): Promise<unknown> {
    return Swal.fire({ icon, title, text, confirmButtonText: 'Aceptar', customClass: { confirmButton: 'btn btn-primary px-4' }, buttonsStyling: false });
  }

  toast(title: string, icon: SweetAlertIcon = 'success'): Promise<unknown> {
    return Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2800, timerProgressBar: true });
  }

  async confirm(title: string, text: string, confirmButtonText = 'Confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'question', title, text, showCancelButton: true,
      confirmButtonText, cancelButtonText: 'Cancelar', reverseButtons: true,
      customClass: { confirmButton: 'btn btn-primary px-4 ms-2', cancelButton: 'btn btn-outline-secondary px-4' },
      buttonsStyling: false
    });
    return result.isConfirmed;
  }
}
