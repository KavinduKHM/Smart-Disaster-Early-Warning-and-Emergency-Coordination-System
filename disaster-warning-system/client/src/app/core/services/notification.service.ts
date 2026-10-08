import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export type NotificationCategory = 
  | 'A1_UNAVAILABLE' 
  | 'A2_REJECTED' 
  | 'A3_REINFORCE' 
  | 'A4_CONNECTIVITY' 
  | 'DISPATCH' 
  | 'GENERAL';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category?: NotificationCategory;
  targetRole: 'ALL' | 'DISTRICT_OFFICER' | 'RESCUE_TEAM';
  timestamp: number;
  read: boolean;
  incidentId?: string;
  assignmentId?: string;
  teamId?: string;
  actionLabel?: string;
  actionType?: string;
}

const STORAGE_KEY = 'disaster_notifications_store';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.loadStoredNotifications());
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  constructor() {
    // Cross-tab / cross-window real-time synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            if (Array.isArray(parsed)) {
              this.notificationsSubject.next(parsed);
            }
          } catch (e) {
            console.error('Failed to parse synchronized notifications', e);
          }
        }
      });
    }
  }

  private loadStoredNotifications(): AppNotification[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading notifications from localStorage', e);
    }

    // Default initial seed notifications
    const seed: AppNotification[] = [
      {
        id: 'seed-notif-1',
        title: 'Emergency Coordination Online',
        message: 'District Command telemetry and field unit synchronization active.',
        type: 'info',
        category: 'GENERAL',
        targetRole: 'ALL',
        timestamp: Date.now() - 3600000,
        read: false
      },
      {
        id: 'seed-notif-2',
        title: 'Monsoon Alert - Sector Active',
        message: 'High precipitation reported in central highlands. Preparedness protocols enacted.',
        type: 'warning',
        category: 'GENERAL',
        targetRole: 'ALL',
        timestamp: Date.now() - 1800000,
        read: false
      }
    ];
    this.saveToStorage(seed);
    return seed;
  }

  private saveToStorage(list: AppNotification[]): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Failed to save notifications to localStorage', e);
      }
    }
  }

  // Toast API
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
    }, 5500);
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }

  // Persistent Notification API
  publishNotification(payload: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    category?: NotificationCategory;
    targetRole?: 'ALL' | 'DISTRICT_OFFICER' | 'RESCUE_TEAM';
    incidentId?: string;
    assignmentId?: string;
    teamId?: string;
    actionLabel?: string;
    actionType?: string;
  }): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category || 'GENERAL',
      targetRole: payload.targetRole || 'ALL',
      timestamp: Date.now(),
      read: false,
      incidentId: payload.incidentId,
      assignmentId: payload.assignmentId,
      teamId: payload.teamId,
      actionLabel: payload.actionLabel,
      actionType: payload.actionType
    };

    const updated = [newNotif, ...this.notificationsSubject.value.slice(0, 49)];
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);

    // Also surface as visual Toast
    this.addToast(newNotif.type, newNotif.title, newNotif.message);

    return newNotif;
  }

  markAsRead(id: string): void {
    const updated = this.notificationsSubject.value.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
  }

  markAllAsRead(role?: 'DISTRICT_OFFICER' | 'RESCUE_TEAM'): void {
    const updated = this.notificationsSubject.value.map(n => {
      if (!role || n.targetRole === 'ALL' || n.targetRole === role) {
        return { ...n, read: true };
      }
      return n;
    });
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
  }

  clearAll(role?: 'DISTRICT_OFFICER' | 'RESCUE_TEAM'): void {
    let updated: AppNotification[];
    if (!role) {
      updated = [];
    } else {
      updated = this.notificationsSubject.value.filter(n => 
        n.targetRole !== 'ALL' && n.targetRole !== role
      );
    }
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
  }

  getUnreadCount(role?: 'DISTRICT_OFFICER' | 'RESCUE_TEAM'): Observable<number> {
    return this.notifications$.pipe(
      map(items => items.filter(n => 
        !n.read && (!role || n.targetRole === 'ALL' || n.targetRole === role)
      ).length)
    );
  }
}
