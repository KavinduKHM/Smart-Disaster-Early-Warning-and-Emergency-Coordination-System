import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;
      const expectedRoles = route.data['roles'] as Array<string>;

      if (expectedRoles && user && !expectedRoles.includes(user.role)) {
        // Redirect to user's own home/dashboard if attempting unauthorized role route
        this.authService.redirectUserByRole(user.role);
        return false;
      }
      return true;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
