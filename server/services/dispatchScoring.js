/**
 * RoadRescue Smart Dispatch Scoring
 * Ranks mechanics by weighted score for optimal assignment
 */
const { DISPATCH_WEIGHTS, MAX_DISPATCH_RANGE_KM, MAX_ACTIVE_JOBS } = require('../../shared/constants');

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Estimate ETA in minutes based on distance (avg 30 km/h in city)
 */
function estimateETA(distanceKm) {
  const avgSpeedKmH = 30;
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

/**
 * Score and rank mechanics for a given request
 * @param {Object[]} mechanics - Array of mechanic profiles
 * @param {Object} request - { lat, lng, faultCategory }
 * @returns {Object[]} Ranked mechanics with scores and explanations
 */
function rankMechanics(mechanics, request) {
  const scored = mechanics
    .filter(m => m.is_available && m.lat && m.lng)
    .map(mechanic => {
      const skills = typeof mechanic.skills === 'string'
        ? JSON.parse(mechanic.skills)
        : mechanic.skills || [];

      // 1. Distance score (40%)
      const distance = haversineDistance(
        request.lat, request.lng,
        mechanic.lat, mechanic.lng
      );
      const distanceScore = Math.max(0, 1 - (distance / MAX_DISPATCH_RANGE_KM));
      const eta = estimateETA(distance);

      // 2. Skill match score (25%)
      const hasSkill = skills.includes(request.faultCategory);
      const skillScore = hasSkill ? 1.0 : 0.3;

      // 3. Rating score (20%)
      const ratingScore = (mechanic.rating || 3.0) / 5.0;

      // 4. Workload score (15%)
      const activeJobs = mechanic.active_jobs || 0;
      const workloadScore = Math.max(0, 1 - (activeJobs / MAX_ACTIVE_JOBS));

      // Weighted total
      const totalScore =
        (distanceScore * DISPATCH_WEIGHTS.DISTANCE) +
        (skillScore * DISPATCH_WEIGHTS.SKILL) +
        (ratingScore * DISPATCH_WEIGHTS.RATING) +
        (workloadScore * DISPATCH_WEIGHTS.WORKLOAD);

      // Generate explanation
      const reasons = [];
      if (distance < 3) reasons.push(`Very close (${distance.toFixed(1)} km away)`);
      else if (distance < 8) reasons.push(`Nearby (${distance.toFixed(1)} km away)`);
      else reasons.push(`${distance.toFixed(1)} km away`);

      if (hasSkill) reasons.push(`Specializes in ${request.faultCategory.replace(/_/g, ' ')}`);
      else reasons.push('General mechanic');

      if (mechanic.rating >= 4.5) reasons.push(`Highly rated (⭐ ${mechanic.rating})`);
      else if (mechanic.rating >= 4.0) reasons.push(`Well rated (⭐ ${mechanic.rating})`);
      else reasons.push(`Rated ⭐ ${mechanic.rating}`);

      if (activeJobs === 0) reasons.push('Currently free');
      else reasons.push(`${activeJobs} active job${activeJobs > 1 ? 's' : ''}`);

      return {
        mechanicId: mechanic.id,
        userId: mechanic.user_id,
        name: mechanic.name,
        phone: mechanic.phone,
        distance: Math.round(distance * 10) / 10,
        eta,
        rating: mechanic.rating,
        totalRatings: mechanic.total_ratings,
        totalJobsDone: mechanic.total_jobs_done,
        avgResponseTime: mechanic.avg_response_time_min,
        skills,
        hasSkill,
        activeJobs,
        lat: mechanic.lat,
        lng: mechanic.lng,
        scores: {
          distance: Math.round(distanceScore * 100),
          skill: Math.round(skillScore * 100),
          rating: Math.round(ratingScore * 100),
          workload: Math.round(workloadScore * 100),
          total: Math.round(totalScore * 100),
        },
        explanation: reasons.join(' · '),
        whyThisMechanic: reasons,
      };
    })
    .filter(m => m.distance <= MAX_DISPATCH_RANGE_KM)
    .sort((a, b) => b.scores.total - a.scores.total);

  return scored;
}

module.exports = { rankMechanics, haversineDistance, estimateETA };
