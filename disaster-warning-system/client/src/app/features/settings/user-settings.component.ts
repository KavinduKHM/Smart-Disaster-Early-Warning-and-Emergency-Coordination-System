import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { AuthService, UserProfile } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html'
})
export class UserSettingsComponent implements OnInit {
  user: UserProfile | null = null;

  activeTab: 'PROFILE' | 'SECURITY' = 'PROFILE';

  // Profile Form State
  profileForm = {
    name: '',
    phone: '',
    district: 'Kandy',
    address: '',
    latitude: 7.2906,
    longitude: 80.6337,
    organization: '',
    teamType: 'WATER_RESCUE',
    membersCount: 10
  };

  districts = [
    'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  teamTypes = [
    { value: 'WATER_RESCUE', label: '🌊 Water Rescue' },
    { value: 'SEARCH_AND_RESCUE', label: '🔍 Search & Rescue' },
    { value: 'MEDICAL', label: '🚑 Emergency Medical' },
    { value: 'FIRE', label: '🔥 Fire & Disaster Response' },
    { value: 'EVACUATION', label: '🚌 Evacuation & Logistics' },
    { value: 'GENERAL', label: '🛡️ General Relief' }
  ];

  isUpdatingProfile: boolean = false;
  isFetchingLocation: boolean = false;
  profileSuccessMessage: string = '';
  profileErrorMessage: string = '';
  locationMapUrl: SafeResourceUrl | null = null;

  // Password Form State
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  isChangingPassword: boolean = false;
  passwordSuccessMessage: string = '';
  passwordErrorMessage: string = '';

  constructor(
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (this.user) {
      this.profileForm.name = this.user.name || '';
      this.profileForm.phone = this.user.phone || '';
      this.profileForm.district = this.user.district || 'Kandy';
      this.profileForm.address = this.user.address || '';
      this.profileForm.latitude = this.user.latitude || 7.2906;
      this.profileForm.longitude = this.user.longitude || 80.6337;
      this.profileForm.organization = this.user.organization || '';
      this.profileForm.teamType = this.user.teamType || 'WATER_RESCUE';
      this.profileForm.membersCount = this.user.membersCount || 10;
    }
    this.updateMapUrl();
  }

  districtCoordsMap: { [key: string]: { lat: number; lng: number } } = {
    'Kandy': { lat: 7.2906, lng: 80.6337 },
    'Colombo': { lat: 6.9271, lng: 79.8612 },
    'Badulla': { lat: 6.9934, lng: 81.0550 },
    'Kegalle': { lat: 7.2513, lng: 80.3464 },
    'Kalutara': { lat: 6.5854, lng: 79.9607 },
    'Galle': { lat: 6.0535, lng: 80.2210 },
    'Matara': { lat: 5.9549, lng: 80.5550 },
    'Ratnapura': { lat: 6.6828, lng: 80.3992 },
    'Kurunegala': { lat: 7.4863, lng: 80.3623 },
    'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
    'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
    'Polonnaruwa': { lat: 7.9403, lng: 81.0188 },
    'Jaffna': { lat: 9.6615, lng: 80.0255 },
    'Batticaloa': { lat: 7.7310, lng: 81.6747 },
    'Trincomalee': { lat: 8.5874, lng: 81.2152 },
    'Hambantota': { lat: 6.1246, lng: 81.1185 }
  };

  fetchGPSLocation(): void {
    if (!navigator.geolocation) {
      this.profileErrorMessage = 'Geolocation is not supported by your browser.';
      return;
    }

    this.isFetchingLocation = true;
    this.profileErrorMessage = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.profileForm.latitude = parseFloat(position.coords.latitude.toFixed(6));
        this.profileForm.longitude = parseFloat(position.coords.longitude.toFixed(6));
        this.isFetchingLocation = false;
        this.detectDistrictFromCoords(this.profileForm.latitude, this.profileForm.longitude);
        this.updateMapUrl();
      },
      (error) => {
        this.isFetchingLocation = false;
        console.warn('Geolocation error:', error);
        this.profileErrorMessage = 'Could not fetch live GPS coordinates. Please set latitude/longitude manually.';
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  detectDistrictFromCoords(lat: number, lng: number): void {
    if (!lat || !lng) return;

    // 1. Immediate Closest Centroid Calculation
    let closestDistrict = 'Kandy';
    let minDistance = Infinity;

    for (const d of this.districts) {
      const coords = this.districtCoordsMap[d];
      if (coords) {
        const dist = Math.hypot(coords.lat - lat, coords.lng - lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestDistrict = d;
        }
      }
    }

    this.profileForm.district = closestDistrict;

    // 2. Asynchronous Reverse Geocoding via OpenStreetMap
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const placeName = (addr.state_district || addr.district || addr.county || addr.city || addr.state || '').toLowerCase();
          
          const matchedDistrict = this.districts.find(d => placeName.includes(d.toLowerCase()));
          if (matchedDistrict) {
            this.profileForm.district = matchedDistrict;
          }
        }
      })
      .catch(err => console.warn('Reverse geocoding error:', err));
  }

  updateMapUrl(): void {
    const rawUrl = `https://maps.google.com/maps?q=${this.profileForm.latitude},${this.profileForm.longitude}&z=15&output=embed`;
    this.locationMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    this.detectDistrictFromCoords(this.profileForm.latitude, this.profileForm.longitude);
  }

  saveProfile(): void {
    if (!this.profileForm.name || !this.profileForm.district) {
      this.profileErrorMessage = 'Name and District are required.';
      return;
    }

    this.isUpdatingProfile = true;
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    const payload = {
      name: this.profileForm.name,
      phone: this.profileForm.phone,
      district: this.profileForm.district,
      address: this.profileForm.address,
      latitude: Number(this.profileForm.latitude),
      longitude: Number(this.profileForm.longitude),
      organization: this.profileForm.organization,
      teamType: this.profileForm.teamType,
      membersCount: Number(this.profileForm.membersCount)
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isUpdatingProfile = false;
        this.user = res.user;
        this.profileSuccessMessage = 'User profile & location settings updated successfully!';
      },
      error: (err) => {
        this.isUpdatingProfile = false;
        this.profileErrorMessage = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  changePassword(): void {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.passwordErrorMessage = 'Please fill in all password fields.';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordErrorMessage = 'New password must be at least 6 characters long.';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordErrorMessage = 'New password and confirmation do not match.';
      return;
    }

    this.isChangingPassword = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    const payload = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };

    this.authService.changePassword(payload).subscribe({
      next: (res) => {
        this.isChangingPassword = false;
        this.passwordSuccessMessage = res.message || 'Password changed successfully!';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.passwordErrorMessage = err.error?.message || 'Failed to update password. Check current password.';
      }
    });
  }

  goBack(): void {
    if (this.user?.role) {
      this.authService.redirectUserByRole(this.user.role);
    } else {
      this.location.back();
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'CITIZEN': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'RESCUE_TEAM': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'DUTY_OFFICER': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DMC_OFFICER': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DISTRICT_OFFICER': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }
}
