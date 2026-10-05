import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'disaster-warning-client';
  
  isDrawerOpen = false;
  isIssueModalOpen = false;

  toggleDrawer(open: boolean) {
    this.isDrawerOpen = open;
  }

  openModal() {
    this.isIssueModalOpen = true;
  }

  closeModal() {
    this.isIssueModalOpen = false;
  }
}
