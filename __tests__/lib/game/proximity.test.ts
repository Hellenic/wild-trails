import { LatLng } from "@/utils/map";

describe("Proximity Calculations", () => {
  describe("LatLng.distanceTo", () => {
    it("should calculate distance between two points correctly", () => {
      // New York City coordinates
      const point1 = new LatLng(40.7128, -74.006);
      // Point ~1km away
      const point2 = new LatLng(40.7228, -74.006);

      const distance = point1.distanceTo(point2);
      
      // Should be approximately 1112 meters (1.112 km)
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1200);
    });

    it("should return 0 for same point", () => {
      const point = new LatLng(40.7128, -74.006);
      const distance = point.distanceTo(point);
      
      expect(distance).toBe(0);
    });

    it("should calculate distance for points close together", () => {
      const point1 = new LatLng(40.7128, -74.006);
      // Point ~50 meters away (approximate trigger distance)
      const point2 = new LatLng(40.71325, -74.006);

      const distance = point1.distanceTo(point2);
      
      // Should be approximately 50 meters
      expect(distance).toBeGreaterThan(40);
      expect(distance).toBeLessThan(60);
    });

    it("should calculate distance for points far apart", () => {
      // New York
      const nyc = new LatLng(40.7128, -74.006);
      // Los Angeles
      const la = new LatLng(34.0522, -118.2437);

      const distance = nyc.distanceTo(la);
      
      // Should be approximately 3,944 km (3,944,000 meters)
      expect(distance).toBeGreaterThan(3900000);
      expect(distance).toBeLessThan(4000000);
    });

    it("should handle equator crossing", () => {
      const northPoint = new LatLng(10, 0);
      const southPoint = new LatLng(-10, 0);

      const distance = northPoint.distanceTo(southPoint);
      
      // 20 degrees of latitude ≈ 2,222 km
      expect(distance).toBeGreaterThan(2200000);
      expect(distance).toBeLessThan(2300000);
    });

    it("should handle dateline crossing", () => {
      const westPoint = new LatLng(0, 179);
      const eastPoint = new LatLng(0, -179);

      const distance = westPoint.distanceTo(eastPoint);
      
      // Should be approximately 222 km (shortest distance across dateline)
      expect(distance).toBeGreaterThan(200000);
      expect(distance).toBeLessThan(250000);
    });
  });

  describe("LatLng.equals", () => {
    it("should return true for equal coordinates", () => {
      const point1 = new LatLng(40.7128, -74.006);
      const point2 = new LatLng(40.7128, -74.006);

      expect(point1.equals(point2)).toBe(true);
    });

    it("should return false for different coordinates", () => {
      const point1 = new LatLng(40.7128, -74.006);
      const point2 = new LatLng(40.7129, -74.006);

      expect(point1.equals(point2)).toBe(false);
    });

    it("should return false for same latitude but different longitude", () => {
      const point1 = new LatLng(40.7128, -74.006);
      const point2 = new LatLng(40.7128, -74.007);

      expect(point1.equals(point2)).toBe(false);
    });
  });
});

