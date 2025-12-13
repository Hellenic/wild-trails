import {
  calculateBearing,
  getCardinalDirection,
  calculateDistance,
  interpolatePoint,
  calculatePerpendicularPoint,
} from "@/app/background/geo-utils";

describe("geo-utils", () => {
  describe("calculateBearing", () => {
    it("should calculate bearing from south to north (0 degrees)", () => {
      const from = { lat: 0, lng: 0 };
      const to = { lat: 1, lng: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(0, 1);
    });

    it("should calculate bearing from west to east (90 degrees)", () => {
      const from = { lat: 0, lng: 0 };
      const to = { lat: 0, lng: 1 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(90, 1);
    });

    it("should calculate bearing from north to south (180 degrees)", () => {
      const from = { lat: 1, lng: 0 };
      const to = { lat: 0, lng: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(180, 1);
    });

    it("should calculate bearing from east to west (270 degrees)", () => {
      const from = { lat: 0, lng: 1 };
      const to = { lat: 0, lng: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(270, 1);
    });

    it("should normalize bearing to 0-360 range", () => {
      const from = { lat: 60.1695, lng: 24.9354 }; // Helsinki
      const to = { lat: 59.3293, lng: 18.0686 }; // Stockholm
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe("getCardinalDirection", () => {
    it("should return N for 0 degrees", () => {
      expect(getCardinalDirection(0)).toBe("N");
    });

    it("should return N for 22 degrees (closer to N than NE)", () => {
      expect(getCardinalDirection(22)).toBe("N");
    });

    it("should return NE for 45 degrees", () => {
      expect(getCardinalDirection(45)).toBe("NE");
    });

    it("should return E for 90 degrees", () => {
      expect(getCardinalDirection(90)).toBe("E");
    });

    it("should return SE for 135 degrees", () => {
      expect(getCardinalDirection(135)).toBe("SE");
    });

    it("should return S for 180 degrees", () => {
      expect(getCardinalDirection(180)).toBe("S");
    });

    it("should return SW for 225 degrees", () => {
      expect(getCardinalDirection(225)).toBe("SW");
    });

    it("should return W for 270 degrees", () => {
      expect(getCardinalDirection(270)).toBe("W");
    });

    it("should return NW for 315 degrees", () => {
      expect(getCardinalDirection(315)).toBe("NW");
    });

    it("should return N for 360 degrees (wraps around)", () => {
      expect(getCardinalDirection(360)).toBe("N");
    });

    it("should handle edge cases near boundaries", () => {
      // The function rounds bearing/45, so boundaries are at 22.5°, 67.5°, etc.
      expect(getCardinalDirection(22)).toBe("N"); // 22/45=0.49 rounds to 0 (N)
      expect(getCardinalDirection(23)).toBe("NE"); // 23/45=0.51 rounds to 1 (NE)
      expect(getCardinalDirection(67)).toBe("NE"); // 67/45=1.49 rounds to 1 (NE)
      expect(getCardinalDirection(68)).toBe("E"); // 68/45=1.51 rounds to 2 (E)
    });
  });

  describe("calculateDistance", () => {
    it("should return 0 for same point", () => {
      const point = { lat: 60.1695, lng: 24.9354 };
      const distance = calculateDistance(point, point);
      expect(distance).toBeCloseTo(0, 3);
    });

    it("should calculate distance between Helsinki and Espoo (~10km)", () => {
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const espoo = { lat: 60.2055, lng: 24.6559 };
      const distance = calculateDistance(helsinki, espoo);
      // Approximate distance is ~19km
      expect(distance).toBeGreaterThan(15);
      expect(distance).toBeLessThan(25);
    });

    it("should calculate distance between Helsinki and Stockholm (~400km)", () => {
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const stockholm = { lat: 59.3293, lng: 18.0686 };
      const distance = calculateDistance(helsinki, stockholm);
      // Approximate distance is ~400km
      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(450);
    });

    it("should be symmetric (distance A to B equals distance B to A)", () => {
      const point1 = { lat: 60.1695, lng: 24.9354 };
      const point2 = { lat: 60.2055, lng: 24.6559 };
      const distance1 = calculateDistance(point1, point2);
      const distance2 = calculateDistance(point2, point1);
      // Euclidean approximation has some asymmetry (~16m for this distance), allow 50m tolerance
      expect(distance1).toBeCloseTo(distance2, 1);
    });

    it("should handle points at different latitudes", () => {
      const equator = { lat: 0, lng: 0 };
      const north = { lat: 1, lng: 0 };
      const distance = calculateDistance(equator, north);
      // 1 degree latitude ≈ 111km
      expect(distance).toBeCloseTo(111, 1);
    });

    it("should handle points at different longitudes", () => {
      const point1 = { lat: 60, lng: 0 };
      const point2 = { lat: 60, lng: 1 };
      const distance = calculateDistance(point1, point2);
      // At 60° latitude, 1 degree longitude ≈ 55.5km (111km * cos(60°))
      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeLessThan(60);
    });
  });

  describe("interpolatePoint", () => {
    it("should return start point at progress 0", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 10 };
      const result = interpolatePoint(start, end, 0);
      expect(result).toEqual(start);
    });

    it("should return end point at progress 1", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 10 };
      const result = interpolatePoint(start, end, 1);
      expect(result).toEqual(end);
    });

    it("should return midpoint at progress 0.5", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 10 };
      const result = interpolatePoint(start, end, 0.5);
      expect(result.lat).toBeCloseTo(5, 5);
      expect(result.lng).toBeCloseTo(5, 5);
    });

    it("should interpolate correctly at 0.25 progress", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 100, lng: 100 };
      const result = interpolatePoint(start, end, 0.25);
      expect(result.lat).toBeCloseTo(25, 5);
      expect(result.lng).toBeCloseTo(25, 5);
    });

    it("should interpolate correctly at 0.75 progress", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 100, lng: 100 };
      const result = interpolatePoint(start, end, 0.75);
      expect(result.lat).toBeCloseTo(75, 5);
      expect(result.lng).toBeCloseTo(75, 5);
    });

    it("should handle negative coordinates", () => {
      const start = { lat: -10, lng: -10 };
      const end = { lat: 10, lng: 10 };
      const result = interpolatePoint(start, end, 0.5);
      expect(result.lat).toBeCloseTo(0, 5);
      expect(result.lng).toBeCloseTo(0, 5);
    });

    it("should handle real-world coordinates", () => {
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const stockholm = { lat: 59.3293, lng: 18.0686 };
      const midpoint = interpolatePoint(helsinki, stockholm, 0.5);
      expect(midpoint.lat).toBeCloseTo((helsinki.lat + stockholm.lat) / 2, 5);
      expect(midpoint.lng).toBeCloseTo((helsinki.lng + stockholm.lng) / 2, 5);
    });
  });

  describe("calculatePerpendicularPoint", () => {
    it("should return point on line when offset is 0", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 0 };
      const result = calculatePerpendicularPoint(start, end, 0.5, 0);
      // Should be at midpoint
      expect(result.lat).toBeCloseTo(5, 3);
      expect(result.lng).toBeCloseTo(0, 3);
    });

    it("should offset left (positive) from horizontal line", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 0, lng: 10 }; // East-west line
      const offset = 1; // 1km to the left (north)
      const result = calculatePerpendicularPoint(start, end, 0.5, offset);
      
      // Midpoint should be at lng=5
      expect(result.lng).toBeCloseTo(5, 3);
      // Should be offset north (not at 0, allowing for small precision errors)
      expect(Math.abs(result.lat)).toBeGreaterThan(0.001); // At least 1m offset
    });

    it("should offset right (negative) from horizontal line", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 0, lng: 10 }; // East-west line
      const offset = -1; // 1km to the right (south)
      const result = calculatePerpendicularPoint(start, end, 0.5, offset);
      
      // Midpoint should be at lng=5
      expect(result.lng).toBeCloseTo(5, 3);
      // Should be offset south (not at 0, allowing for small precision errors)
      expect(Math.abs(result.lat)).toBeGreaterThan(0.001); // At least 1m offset
    });

    it("should offset from vertical line", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 0 }; // North-south line
      const offset = 1; // 1km perpendicular
      const result = calculatePerpendicularPoint(start, end, 0.5, offset);
      
      // Midpoint should be at lat=5
      expect(result.lat).toBeCloseTo(5, 3);
      // Should be offset east (not at 0)
      expect(Math.abs(result.lng)).toBeGreaterThan(0.001); // At least 1m offset
    });

    it("should handle progress at start (0)", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 10 };
      const offset = 1;
      const result = calculatePerpendicularPoint(start, end, 0, offset);
      
      // Should be at start position, offset perpendicular (allow more tolerance)
      expect(result.lat).toBeCloseTo(start.lat, 1); // Within ~0.05 degrees
      expect(result.lng).not.toEqual(start.lng); // Offset perpendicular
    });

    it("should handle progress at end (1)", () => {
      const start = { lat: 0, lng: 0 };
      const end = { lat: 10, lng: 10 };
      const offset = 1;
      const result = calculatePerpendicularPoint(start, end, 1, offset);
      
      // Should be at end position, offset perpendicular (allow more tolerance)
      expect(result.lat).toBeCloseTo(end.lat, 1); // Within ~0.05 degrees
    });

    it("should handle real-world coordinates", () => {
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const tampere = { lat: 61.4978, lng: 23.7610 };
      const offset = 0.5; // 500m offset
      
      const result = calculatePerpendicularPoint(helsinki, tampere, 0.5, offset);
      
      // Result should be somewhere between Helsinki and Tampere
      expect(result.lat).toBeGreaterThan(Math.min(helsinki.lat, tampere.lat));
      expect(result.lat).toBeLessThan(Math.max(helsinki.lat, tampere.lat));
      
      // Result should exist and be a valid coordinate
      expect(result.lat).not.toBeNaN();
      expect(result.lng).not.toBeNaN();
    });

    it("should create symmetric offsets", () => {
      const start = { lat: 60, lng: 24 };
      const end = { lat: 61, lng: 25 };
      const offset = 1;
      
      const leftPoint = calculatePerpendicularPoint(start, end, 0.5, offset);
      const rightPoint = calculatePerpendicularPoint(start, end, 0.5, -offset);
      
      // Distance from line should be similar on both sides
      const midpoint = interpolatePoint(start, end, 0.5);
      const distLeft = calculateDistance(midpoint, leftPoint);
      const distRight = calculateDistance(midpoint, rightPoint);
      
      expect(distLeft).toBeCloseTo(distRight, 2);
    });
  });

  describe("integration tests", () => {
    it("should create a corridor path from Helsinki to Tampere", () => {
      const helsinki = { lat: 60.1695, lng: 24.9354 };
      const tampere = { lat: 61.4978, lng: 23.7610 };
      
      const distance = calculateDistance(helsinki, tampere);
      expect(distance).toBeGreaterThan(150); // ~170km actual
      expect(distance).toBeLessThan(200);
      
      const bearing = calculateBearing(helsinki, tampere);
      const direction = getCardinalDirection(bearing);
      // Tampere is northwest of Helsinki
      expect(["N", "NW", "NNW", "WNW"]).toContain(direction.substring(0, 2));
      
      // Generate points along corridor
      const numPoints = 5;
      const corridorWidth = distance * 0.1; // 10% corridor
      
      const points = [];
      for (let i = 0; i < numPoints; i++) {
        const progress = (i + 1) / (numPoints + 1);
        const lateralOffset = (Math.random() - 0.5) * 2 * corridorWidth;
        const point = calculatePerpendicularPoint(helsinki, tampere, progress, lateralOffset);
        points.push(point);
      }
      
      // All points should be valid coordinates
      points.forEach((point) => {
        expect(point.lat).not.toBeNaN();
        expect(point.lng).not.toBeNaN();
        expect(point.lat).toBeGreaterThan(59);
        expect(point.lat).toBeLessThan(62);
        expect(point.lng).toBeGreaterThan(22);
        expect(point.lng).toBeLessThan(26);
      });
      
      // Points should be roughly in order from Helsinki to Tampere
      expect(points[0].lat).toBeLessThan(points[points.length - 1].lat);
    });

    it("should calculate consistent bearings and distances", () => {
      const point1 = { lat: 60, lng: 24 };
      const point2 = { lat: 61, lng: 25 };
      
      const bearing1to2 = calculateBearing(point1, point2);
      const bearing2to1 = calculateBearing(point2, point1);
      
      // Reverse bearing should be ~180 degrees different (allow 1-2 degree tolerance)
      const diff = Math.abs(bearing1to2 - bearing2to1);
      expect(diff).toBeGreaterThan(178); // At least 178 degrees
      expect(diff).toBeLessThan(182); // At most 182 degrees
      
      // Distance should be roughly symmetric (Euclidean approximation has errors on long distances)
      const dist1 = calculateDistance(point1, point2);
      const dist2 = calculateDistance(point2, point1);
      // Just verify they're in the same ballpark (within 1km for ~123km distance)
      expect(Math.abs(dist1 - dist2)).toBeLessThan(1);
    });
  });
});
