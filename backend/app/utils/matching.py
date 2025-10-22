from app.models.tenant_preference import TenantPreference
from typing import List, Dict
import re


def calculate_compatibility_score(pref1: TenantPreference, pref2: TenantPreference) -> Dict:
    """
    Calculate compatibility score between two tenant preferences.
    Returns a dictionary with overall score and breakdown by category.
    """
    
    # Lifestyle compatibility (1-5 scale, closer values = higher score)
    cleanliness_score = 100 - abs(pref1.cleanliness_importance - pref2.cleanliness_importance) * 20
    noise_score = 100 - abs(pref1.noise_tolerance - pref2.noise_tolerance) * 20
    social_score = 100 - abs(pref1.social_preference - pref2.social_preference) * 20
    guest_score = 100 - abs(pref1.guest_frequency - pref2.guest_frequency) * 20
    
    # Schedule compatibility
    sleep_score = calculate_schedule_compatibility(pref1.sleep_schedule, pref2.sleep_schedule)
    work_score = calculate_schedule_compatibility(pref1.work_schedule, pref2.work_schedule)
    
    # Dealbreakers (binary - if mismatch, significant penalty)
    dealbreaker_score = 100
    if pref1.smoking != pref2.smoking:
        dealbreaker_score -= 50  # Major incompatibility
    if pref1.pets != pref2.pets:
        dealbreaker_score -= 30  # Moderate incompatibility
    if pref1.overnight_guests != pref2.overnight_guests:
        dealbreaker_score -= 20  # Minor incompatibility
    
    # Interests compatibility
    interests_score = calculate_interests_compatibility(pref1.interests, pref2.interests)
    
    # Calculate weighted average
    weights = {
        'cleanliness': 0.15,
        'noise': 0.15,
        'social': 0.15,
        'guests': 0.10,
        'sleep_schedule': 0.10,
        'work_schedule': 0.10,
        'dealbreakers': 0.20,
        'interests': 0.05
    }
    
    overall_score = (
        cleanliness_score * weights['cleanliness'] +
        noise_score * weights['noise'] +
        social_score * weights['social'] +
        guest_score * weights['guests'] +
        sleep_score * weights['sleep_schedule'] +
        work_score * weights['work_schedule'] +
        dealbreaker_score * weights['dealbreakers'] +
        interests_score * weights['interests']
    )
    
    return {
        'overall': round(overall_score, 1),
        'cleanliness': round(cleanliness_score, 1),
        'noise': round(noise_score, 1),
        'social': round(social_score, 1),
        'guests': round(guest_score, 1),
        'sleep_schedule': round(sleep_score, 1),
        'work_schedule': round(work_score, 1),
        'dealbreakers': round(dealbreaker_score, 1),
        'interests': round(interests_score, 1)
    }


def calculate_schedule_compatibility(schedule1: str, schedule2: str) -> float:
    """Calculate compatibility between two schedules"""
    if not schedule1 or not schedule2:
        return 50  # Neutral if not specified
    
    schedule1 = schedule1.lower()
    schedule2 = schedule2.lower()
    
    # Exact match
    if schedule1 == schedule2:
        return 100
    
    # Compatible schedules
    compatible_pairs = [
        ('early', 'flexible'),
        ('late', 'flexible'),
        ('flexible', 'early'),
        ('flexible', 'late'),
        ('remote', 'flexible'),
        ('hybrid', 'flexible'),
        ('flexible', 'remote'),
        ('flexible', 'hybrid')
    ]
    
    for pair in compatible_pairs:
        if (schedule1 == pair[0] and schedule2 == pair[1]) or (schedule1 == pair[1] and schedule2 == pair[0]):
            return 80
    
    # Incompatible schedules
    incompatible_pairs = [
        ('early', 'late'),
        ('late', 'early'),
        ('office', 'remote'),
        ('remote', 'office')
    ]
    
    for pair in incompatible_pairs:
        if (schedule1 == pair[0] and schedule2 == pair[1]) or (schedule1 == pair[1] and schedule2 == pair[0]):
            return 20
    
    # Default neutral score
    return 50


def calculate_interests_compatibility(interests1: str, interests2: str) -> float:
    """Calculate compatibility based on shared interests"""
    if not interests1 or not interests2:
        return 50  # Neutral if not specified
    
    # Parse interests (comma-separated)
    interests1_list = [interest.strip().lower() for interest in interests1.split(',') if interest.strip()]
    interests2_list = [interest.strip().lower() for interest in interests2.split(',') if interest.strip()]
    
    if not interests1_list or not interests2_list:
        return 50
    
    # Calculate Jaccard similarity
    set1 = set(interests1_list)
    set2 = set(interests2_list)
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    if union == 0:
        return 50
    
    similarity = intersection / union
    return similarity * 100


def find_roommate_matches(
    tenant_pref: TenantPreference, 
    candidate_prefs: List[TenantPreference], 
    top_n: int = 5
) -> List[Dict]:
    """
    Find the best roommate matches for a tenant.
    Returns a list of matches sorted by compatibility score.
    """
    matches = []
    
    for candidate_pref in candidate_prefs:
        if candidate_pref.tenant_id == tenant_pref.tenant_id:
            continue  # Skip self
        
        # Calculate compatibility
        compatibility = calculate_compatibility_score(tenant_pref, candidate_pref)
        
        # Get common interests
        common_interests = get_common_interests(tenant_pref.interests, candidate_pref.interests)
        
        # Create match object
        match = {
            'tenant_id': str(candidate_pref.tenant_id),
            'email': candidate_pref.tenant.email if hasattr(candidate_pref, 'tenant') else 'Unknown',
            'current_room_id': str(candidate_pref.tenant.room_id) if hasattr(candidate_pref, 'tenant') else 'Unknown',
            'compatibility_score': compatibility['overall'],
            'breakdown': compatibility,
            'common_interests': common_interests
        }
        
        matches.append(match)
    
    # Sort by compatibility score (descending)
    matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
    
    # Return top N matches
    return matches[:top_n]


def get_common_interests(interests1: str, interests2: str) -> List[str]:
    """Get list of common interests between two tenants"""
    if not interests1 or not interests2:
        return []
    
    interests1_list = [interest.strip().lower() for interest in interests1.split(',') if interest.strip()]
    interests2_list = [interest.strip().lower() for interest in interests2.split(',') if interest.strip()]
    
    common = list(set(interests1_list).intersection(set(interests2_list)))
    return common
