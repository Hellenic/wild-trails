export class LatLng {
  constructor(
    public lat: number,
    public lng: number
  ) {}

  // Returns distance in meters between two points
  distanceTo(other: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.lat * Math.PI) / 180;
    const φ2 = (other.lat * Math.PI) / 180;
    const Δφ = ((other.lat - this.lat) * Math.PI) / 180;
    const Δλ = ((other.lng - this.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  equals(other: LatLng): boolean {
    return this.lat === other.lat && this.lng === other.lng;
  }

  // Convert to simple object format
  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
    };
  }

  // Create from a simple object
  static fromJSON(json: { lat: number; lng: number }): LatLng {
    return new LatLng(json.lat, json.lng);
  }
}
