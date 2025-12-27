/**
 * Fun facts and journey comparisons for game completion
 */

/**
 * Get a contextual journey comparison based on distance traveled
 */
export function getJourneyComparison(
  distanceKm: number,
  timeMinutes: number,
  waypointsVisited: number
): string {
  // Small distances (< 1km)
  if (distanceKm < 1) {
    const footballFields = Math.round(distanceKm * 10); // ~100m per field
    return `You traveled ${footballFields} football field${footballFields !== 1 ? 's' : ''} worth of distance!`;
  }
  
  // Medium distances (1-5km)
  if (distanceKm < 5) {
    const cityBlocks = Math.round(distanceKm * 12.5); // ~80m per block
    return `You covered approximately ${cityBlocks} city blocks of ground!`;
  }
  
  // Longer distances (5-15km)
  if (distanceKm < 15) {
    return `You traveled ${distanceKm.toFixed(1)}km - that's the start of a wolf's daily patrol!`;
  }
  
  // Very long distances (15-30km)
  if (distanceKm < 30) {
    return `You traveled ${distanceKm.toFixed(1)}km - that's within a typical wolf's daily patrol range (15-30km)!`;
  }
  
  // Extremely long distances (30km+)
  const marathonPercent = Math.round((distanceKm / 42.195) * 100);
  if (marathonPercent >= 100) {
    return `You traveled ${distanceKm.toFixed(1)}km - that's more than a full marathon!`;
  } else {
    return `You traveled ${distanceKm.toFixed(1)}km - that's ${marathonPercent}% of a marathon distance!`;
  }
}

/**
 * Get a random nature/wildlife fact, optionally themed by difficulty
 */
export function getNatureFact(difficulty?: 'easy' | 'medium' | 'hard'): string {
  const wolfFacts = [
    "Wolves can smell prey up to 1.5 miles (2.4 km) away in favorable conditions.",
    "A wolf pack's territory can range from 50 to over 1,000 square miles depending on prey availability.",
    "Wolves can travel up to 30 miles (48 km) in a single day when hunting or patrolling.",
    "Wolf paw prints measure 4-5 inches long - larger than most dog breeds!",
    "Wolves navigate using scent markers, visual landmarks, and an incredible sense of direction.",
  ];
  
  const natureFacts = [
    "Well-maintained trails prevent soil erosion by directing foot traffic away from sensitive areas.",
    "Urban trees can increase property values by up to 15% and reduce air temperature by 2-9°F.",
    "Walking in nature for just 20 minutes can significantly reduce stress hormones.",
    "Forest bathing (spending time in nature) has been scientifically proven to boost immune function.",
    "Natural navigation skills were essential for human survival for thousands of years.",
  ];
  
  const trailFacts = [
    "The average hiking speed is 3-5 km/h depending on terrain and elevation.",
    "Regular outdoor navigation improves spatial memory and cognitive function.",
    "GPS accuracy can vary from 5-30 meters depending on conditions and device quality.",
    "Traditional wayfinding used the sun, stars, wind patterns, and natural landmarks.",
    "Wildlife often uses the same trails repeatedly, creating natural pathways through terrain.",
  ];
  
  // Combine all facts
  const allFacts = [...wolfFacts, ...natureFacts, ...trailFacts];
  
  // Return random fact
  const randomIndex = Math.floor(Math.random() * allFacts.length);
  return allFacts[randomIndex];
}

/**
 * Get an encouraging message based on completion status
 */
export function getEncouragingMessage(
  waypointsVisited: number,
  totalWaypoints: number,
  gaveUp: boolean
): string {
  if (gaveUp) {
    return "Every adventure is a learning experience - you'll conquer the next one!";
  }
  
  if (waypointsVisited === totalWaypoints) {
    return "Perfect navigation! You found every waypoint along the way!";
  }
  
  if (waypointsVisited >= totalWaypoints * 0.75) {
    return "Excellent work! You discovered most of the waypoints on your journey!";
  }
  
  return "Every step counts! Each adventure builds your navigation skills!";
}

