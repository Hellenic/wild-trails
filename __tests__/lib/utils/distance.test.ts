import {
  formatDistance,
  formatDistanceFromMeters,
  getDistanceUnit,
  kmToMiles,
  milesToKm,
} from "@/lib/utils/distance";

describe("distance utilities", () => {
  describe("formatDistance", () => {
    it("should format kilometers correctly", () => {
      expect(formatDistance(5, "km")).toBe("5.0 km");
      expect(formatDistance(10.5, "km")).toBe("10.5 km");
      expect(formatDistance(0.5, "km")).toBe("0.5 km");
    });

    it("should format miles correctly", () => {
      expect(formatDistance(5, "miles")).toBe("3.1 mi");
      expect(formatDistance(10, "miles")).toBe("6.2 mi");
      expect(formatDistance(1.60934, "miles")).toBe("1.0 mi");
    });

    it("should respect decimal places parameter", () => {
      expect(formatDistance(5.567, "km", 0)).toBe("6 km");
      expect(formatDistance(5.567, "km", 2)).toBe("5.57 km");
      expect(formatDistance(5.567, "miles", 3)).toBe("3.459 mi");
    });

    it("should default to km when no unit specified", () => {
      expect(formatDistance(5)).toBe("5.0 km");
    });
  });

  describe("formatDistanceFromMeters", () => {
    it("should format large distances in kilometers", () => {
      expect(formatDistanceFromMeters(5000, "km")).toBe("5.0 km");
      expect(formatDistanceFromMeters(10500, "km")).toBe("10.5 km");
    });

    it("should format small distances in meters", () => {
      expect(formatDistanceFromMeters(500, "km")).toBe("500 m");
      expect(formatDistanceFromMeters(50, "km")).toBe("50 m");
    });

    it("should format large distances in miles", () => {
      expect(formatDistanceFromMeters(5000, "miles")).toBe("3.1 mi");
      expect(formatDistanceFromMeters(10000, "miles")).toBe("6.2 mi");
    });

    it("should format very small distances in feet", () => {
      expect(formatDistanceFromMeters(30, "miles")).toBe("98 ft");
      expect(formatDistanceFromMeters(10, "miles")).toBe("33 ft");
    });

    it("should handle edge case at 1km boundary", () => {
      expect(formatDistanceFromMeters(999, "km")).toBe("999 m");
      expect(formatDistanceFromMeters(1000, "km")).toBe("1.0 km");
      expect(formatDistanceFromMeters(1001, "km")).toBe("1.0 km");
    });

    it("should respect decimal places parameter", () => {
      expect(formatDistanceFromMeters(5567, "km", 0)).toBe("6 km");
      expect(formatDistanceFromMeters(5567, "km", 2)).toBe("5.57 km");
    });
  });

  describe("getDistanceUnit", () => {
    it("should return correct unit labels", () => {
      expect(getDistanceUnit("km")).toBe("km");
      expect(getDistanceUnit("miles")).toBe("mi");
    });

    it("should default to km", () => {
      expect(getDistanceUnit()).toBe("km");
    });
  });

  describe("kmToMiles", () => {
    it("should convert kilometers to miles correctly", () => {
      expect(kmToMiles(1)).toBeCloseTo(0.621371, 5);
      expect(kmToMiles(5)).toBeCloseTo(3.106855, 5);
      expect(kmToMiles(10)).toBeCloseTo(6.21371, 5);
      expect(kmToMiles(100)).toBeCloseTo(62.1371, 4);
    });

    it("should handle zero", () => {
      expect(kmToMiles(0)).toBe(0);
    });

    it("should handle decimal values", () => {
      expect(kmToMiles(1.5)).toBeCloseTo(0.932057, 5);
      expect(kmToMiles(0.5)).toBeCloseTo(0.310686, 5);
    });
  });

  describe("milesToKm", () => {
    it("should convert miles to kilometers correctly", () => {
      expect(milesToKm(1)).toBeCloseTo(1.609344, 5);
      expect(milesToKm(5)).toBeCloseTo(8.04672, 5);
      expect(milesToKm(10)).toBeCloseTo(16.09344, 4);
    });

    it("should handle zero", () => {
      expect(milesToKm(0)).toBe(0);
    });

    it("should handle decimal values", () => {
      expect(milesToKm(1.5)).toBeCloseTo(2.414016, 5);
      expect(milesToKm(0.5)).toBeCloseTo(0.804672, 5);
    });

    it("should be inverse of kmToMiles", () => {
      const km = 42.195; // Marathon distance
      const miles = kmToMiles(km);
      const backToKm = milesToKm(miles);
      expect(backToKm).toBeCloseTo(km, 10);
    });
  });

  describe("conversion consistency", () => {
    it("should maintain precision in round-trip conversions", () => {
      const testValues = [1, 5, 10, 42.195, 100];
      
      testValues.forEach((km) => {
        const miles = kmToMiles(km);
        const backToKm = milesToKm(miles);
        expect(backToKm).toBeCloseTo(km, 10);
      });
    });
  });
});

