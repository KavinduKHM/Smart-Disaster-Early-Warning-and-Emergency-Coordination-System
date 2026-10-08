import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left" #container>
      <!-- Bell Button -->
      <button 
        type="button"
        (click)="toggleOpen()" 
        title="Notifications"
        class="relative p-2 rounded-xl text-[#64748B] hover:text-[#0B192C] hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20">
        
        <!-- Bell Icon -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <!-- Unread Badge -->
        <span *ngIf="unreadCount > 0" 
          class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>

      <!-- Dropdown Popover Menu -->
      <div *ngIf="isOpen" 
        class="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden flex flex-col max-h-[520px] transition-all animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Header -->
        <div class="px-5 py-4 border-b border-[#E2E8F0] bg-[#0B192C] text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-xs font-bold shadow">
              🔔
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-white">Emergency Notifications</h3>
              <p class="text-[10px] text-slate-300">{{ unreadCount }} unread alert{{ unreadCount === 1 ? '' : 's' }}</p>
            </div>
          </div>
          <button *ngIf="unreadCount > 0" 
            (click)="markAllAsRead()" 
            class="text-[11px] font-semibold text-blue-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md">
            Mark all read
          </button>
        </div>

        <!-- Filter Chips -->
        <div class="flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px]">
          <button (click)="activeFilter = 'ALL'"
            [ngClass]="activeFilter === 'ALL' ? 'bg-[#1D4ED8] text-white font-bold' : 'bg-white text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]'"
            class="px-2.5 py-1 rounded-full transition-colors">
            All ({{ filteredList.length }})
          </button>
          <button (click)="activeFilter = 'UNREAD'"
            [ngClass]="activeFilter === 'UNREAD' ? 'bg-[#1D4ED8] text-white font-bold' : 'bg-white text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]'"
            class="px-2.5 py-1 rounded-full transition-colors">
            Unread ({{ unreadCount }})
          </button>
          <button (click)="activeFilter = 'CRITICAL'"
            [ngClass]="activeFilter === 'CRITICAL' ? 'bg-[#DC2626] text-white font-bold' : 'bg-white text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]'"
            class="px-2.5 py-1 rounded-full transition-colors">
            Critical Events
          </button>
        </div>

        <!-- Notification List -->
        <div class="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] max-h-[350px]">
          <div *ngIf="displayedNotifications.length === 0" class="py-10 px-4 text-center">
            <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-lg mb-2">
              🔕
            </div>
            <p class="text-xs font-semibold text-[#0B192C]">No notifications</p>
            <p class="text-[11px] text-[#64748B] mt-0.5">Everything is normal. Dispatches will show here.</p>
          </div>

          <div *ngFor="let item of displayedNotifications" 
            (click)="onItemClick(item)"
            [ngClass]="item.read ? 'bg-white hover:bg-[#F8FAFC]' : 'bg-blue-50/40 hover:bg-blue-50/70'"
            class="p-4 transition-colors cursor-pointer group relative flex items-start gap-3">
            
            <!-- Type Icon Indicator -->
            <div [ngClass]="getIconBg(item)" 
              class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm border mt-0.5">
              <span>{{ getCategoryIcon(item) }}</span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="text-xs font-bold text-[#0B192C] truncate">{{ item.title }}</span>
                <span class="text-[10px] text-[#64748B] whitespace-nowrap">{{ formatTime(item.timestamp) }}</span>
              </div>
              <p class="text-xs text-[#475569] leading-relaxed line-clamp-2">{{ item.message }}</p>

              <!-- Category Badge & Optional Action Button -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span [ngClass]="getCategoryBadgeClass(item.category)" 
                  class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border font-mono">
                  {{ formatCategory(item.category) }}
                </span>

                <button *ngIf="item.actionLabel" 
                  (click)="handleAction($event, item)"
                  class="text-[10px] font-bold text-[#1D4ED8] bg-blue-100 hover:bg-[#1D4ED8] hover:text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                  <span>{{ item.actionLabel }}</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <!-- Unread Dot / Dismiss -->
            <div class="flex flex-col items-center gap-1 flex-shrink-0">
              <span *ngIf="!item.read" class="w-2 h-2 rounded-full bg-[#1D4ED8]"></span>
              <button (click)="markAsRead($event, item.id)" title="Mark read" 
                class="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#0B192C] transition-opacity p-0.5">
                ✓
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
          <span class="text-[10px] text-[#64748B]">
            Sync: <strong class="text-[#0B192C]">Live Multi-Dashboard Channel</strong>
          </span>
          <button (click)="clearAll()" 
            class="text-[11px] font-semibold text-[#DC2626] hover:underline">
            Clear all
          </button>
        </div>

      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() role: 'DISTRICT_OFFICER' | 'RESCUE_TEAM' | 'ALL' = 'ALL';
  @Output() notificationAction = new EventEmitter<AppNotification>();

  isOpen = false;
  activeFilter: 'ALL' | 'UNREAD' | 'CRITICAL' = 'ALL';
  notifications: AppNotification[] = [];
  private sub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.sub = this.notificationService.notifications$.subscribe(list => {
      this.notifications = list;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  get filteredList(): AppNotification[] {
    return this.notifications.filter(n => 
      this.role === 'ALL' || n.targetRole === 'ALL' || n.targetRole === this.role
    );
  }

  get unreadCount(): number {
    return this.filteredList.filter(n => !n.read).length;
  }

  get displayedNotifications(): AppNotification[] {
    return this.filteredList.filter(n => {
      if (this.activeFilter === 'UNREAD') return !n.read;
      if (this.activeFilter === 'CRITICAL') {
        return n.type === 'error' || n.type === 'warning' || 
               n.category === 'A1_UNAVAILABLE' || n.category === 'A2_REJECTED';
      }
      return true;
    });
  }

  markAllAsRead(): void {
    const roleFilter = this.role === 'ALL' ? undefined : this.role;
    this.notificationService.markAllAsRead(roleFilter);
  }

  clearAll(): void {
    const roleFilter = this.role === 'ALL' ? undefined : this.role;
    this.notificationService.clearAll(roleFilter);
  }

  markAsRead(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  onItemClick(item: AppNotification): void {
    if (!item.read) {
      this.notificationService.markAsRead(item.id);
    }
    if (item.actionLabel) {
      this.notificationAction.emit(item);
      this.isOpen = false;
    }
  }

  handleAction(event: MouseEvent, item: AppNotification): void {
    event.stopPropagation();
    if (!item.read) {
      this.notificationService.markAsRead(item.id);
    }
    this.notificationAction.emit(item);
    this.isOpen = false;
  }

  formatTime(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  getCategoryIcon(item: AppNotification): string {
    switch (item.category) {
      case 'A1_UNAVAILABLE': return '⚠️';
      case 'A2_REJECTED': return '🚨';
      case 'A3_REINFORCE': return '👥';
      case 'A4_CONNECTIVITY': return '📶';
      case 'DISPATCH': return '🛡️';
      default:
        if (item.type === 'error') return '🚨';
        if (item.type === 'warning') return '⚠️';
        if (item.type === 'success') return '✅';
        return 'ℹ️';
    }
  }

  getIconBg(item: AppNotification): string {
    switch (item.type) {
      case 'error': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  }

  formatCategory(cat?: string): string {
    switch (cat) {
      case 'A1_UNAVAILABLE': return 'A1: Team Unavailable';
      case 'A2_REJECTED': return 'A2: Mission Declined';
      case 'A3_REINFORCE': return 'A3: Multi-Unit Reinforce';
      case 'A4_CONNECTIVITY': return 'A4: Field Sync';
      case 'DISPATCH': return 'Dispatch';
      default: return 'System Alert';
    }
  }

  getCategoryBadgeClass(cat?: string): any {
    switch (cat) {
      case 'A1_UNAVAILABLE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'A2_REJECTED': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'A3_REINFORCE': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'A4_CONNECTIVITY': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  }
}
