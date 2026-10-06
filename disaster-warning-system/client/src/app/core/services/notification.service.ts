import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  showSuccess(title: string, message: string): void {
    this.addToast('success', title, message);
  }

  showError(title: string, message: string): void {
    this.addToast('error', title, message);
  }

  showWarning(title: string, message: string): void {
    this.addToast('warning', title, message);
  }

  showInfo(title: string, message: string): void {
    this.addToast('info', title, message);
  }

  private addToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }
}
