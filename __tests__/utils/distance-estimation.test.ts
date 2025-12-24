/**
 * Tests for distance estimation functionality
 * Used in the drawer menu to show estimated distance remaining
 * @jest-environment node
 */

import { calculateDistance } from "@/app/background/geo-utils";

describe("Distance Estimation", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two close points", () => {
      // Points approximately 1km apart in Helsinki
      const point1 = { lat: 60.1695, lng: 24.9354 };
      const point2 = { lat: 60.1785, lng: 24.9354 };
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 1km
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    it("should return 0 for same point", () => {
      const point = { lat: 60.1695, lng: 24.9354 };
      const distance = calculateDistance(point, point);
      expect(distance).toBeCloseTo(0, 2);
    });

    it("should calculate longer distances", () => {
      // Helsinki to Espoo (about 15km)
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const espoo = { lat: 60.2055, lng: 24.6559 };
      const distance = calculateDistance(helsinki, espoo);
      
      // Should be approximately 15-20km
      expect(distance).toBeGreaterThan(14);
      expect(distance).toBeLessThan(21);
    });

    it("should work with negative coordinates", () => {
      const point1 = { lat: -33.8688, lng: 151.2093 }; // Sydney
      const point2 = { lat: -33.8788, lng: 151.2193 }; // Nearby
      const distance = calculateDistance(point1, point2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });
  });

  describe("Distance Estimation with Error Margin", () => {
    it("should apply 20% error margin", () => {
      const actualDistance = 5.0; // km
      const errorMargin = Math.max(0.5, actualDistance * 0.2);
      
      expect(errorMargin).toBe(1.0);
      
      const minEstimate = actualDistance - errorMargin;
      const maxEstimate = actualDistance + errorMargin;
      
      expect(minEstimate).toBe(4.0);
      expect(maxEstimate).toBe(6.0);
    });

    it("should use minimum 500m error margin", () => {
      const actualDistance = 1.0; // km
      const errorMargin = Math.max(0.5, actualDistance * 0.2);
      
      // 20% of 1km is 200m, but minimum is 500m
      expect(errorMargin).toBe(0.5);
    });

    it("should scale error margin for longer distances", () => {
      const actualDistance = 10.0; // km
      const errorMargin = Math.max(0.5, actualDistance * 0.2);
      
      expect(errorMargin).toBe(2.0);
    });
  });
});
