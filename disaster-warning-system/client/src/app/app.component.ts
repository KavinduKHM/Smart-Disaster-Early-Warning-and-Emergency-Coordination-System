import { Component, OnInit } from '@angular/core';
import { NotificationService, ToastMessage } from './core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'Disaster Warning System';
  toasts$: Observable<ToastMessage[]>;

  constructor(private notificationService: NotificationService) {
    this.toasts$ = this.notificationService.toasts$;
  }

  ngOnInit(): void {}

  removeToast(id: string): void {
    this.notificationService.removeToast(id);
  }
}
