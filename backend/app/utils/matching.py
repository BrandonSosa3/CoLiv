from typing import List, Dict
from app.models.tenant_preference import TenantPreference


def calculate_compatibility_score(pref1: TenantPreference, pref2: TenantPreference) -> Dict:
    """
    Calculate compatibility score between two tenants (0-100%)
    Returns dict with overall score and breakdown
    """
    
    if not pref1 or not pref2:
        return {"overall": 0, "breakdown": {}}
    
    scores = {}
    weights = {
        "cleanliness": 0.25,      # 25% - Very important
        "noise": 0.15,             # 15%
        "sleep_schedule": 0.15,    # 15%
        "social": 0.10,            # 10%
        "guests": 0.10,            # 10%
        "work_schedule": 0.10,     # 10%
        "dealbreakers": 0.10,      # 10% - Smoking/pets
        "interests": 0.05,         # 5% - Nice to have
    }
    
    # 1. Cleanliness compatibility (closer is better)
    cleanliness_diff = abs(pref1.cleanliness_importance - pref2.cleanliness_importance)
    scores["cleanliness"] = max(0, 100 - (cleanliness_diff * 25))
    
    # 2. Noise tolerance (closer is better)
    noise_diff = abs(pref1.noise_tolerance - pref2.noise_tolerance)
    scores["noise"] = max(0, 100 - (noise_diff * 25))
    
    # 3. Sleep schedule compatibility
    sleep_compat = {
        ("early_bird", "early_bird"): 100,
        ("night_owl", "night_owl"): 100,
        ("flexible", "flexible"): 90,
        ("early_bird", "flexible"): 80,
        ("night_owl", "flexible"): 80,
        ("flexible", "early_bird"): 80,
        ("flexible", "night_owl"): 80,
        ("early_bird", "night_owl"): 30,  # Potential conflict
        ("night_owl", "early_bird"): 30,
    }
    sleep_key = (pref1.sleep_schedule or "flexible", pref2.sleep_schedule or "flexible")
    scores["sleep_schedule"] = sleep_compat.get(sleep_key, 50)
    
    # 4. Social preference (closer is better, but not critical)
    social_diff = abs(pref1.social_preference - pref2.social_preference)
    scores["social"] = max(0, 100 - (social_diff * 20))
    
    # 5. Guest frequency (closer is better)
    guest_diff = abs(pref1.guest_frequency - pref2.guest_frequency)
    scores["guests"] = max(0, 100 - (guest_diff * 25))
    
    # 6. Work schedule compatibility
    work_compat = {
        ("remote", "remote"): 100,      # Both home often
        ("office", "office"): 100,      # Both away often
        ("remote", "office"): 90,       # Balanced
        ("office", "remote"): 90,
        ("hybrid", "hybrid"): 95,
        ("hybrid", "remote"): 85,
        ("hybrid", "office"): 85,
        ("remote", "hybrid"): 85,
        ("office", "hybrid"): 85,
        ("student", "student"): 90,
        ("student", "remote"): 80,
        ("student", "office"): 85,
        ("student", "hybrid"): 85,
    }
    work_key = (pref1.work_schedule or "remote", pref2.work_schedule or "remote")
    scores["work_schedule"] = work_compat.get(work_key, 75)
    
    # 7. Dealbreakers (if mismatched on smoking/pets, major penalty)
    dealbreaker_score = 100
    if pref1.smoking != pref2.smoking:
        dealbreaker_score -= 50  # Major issue
    if pref1.pets != pref2.pets:
        dealbreaker_score -= 30  # Moderate issue
    if pref1.overnight_guests != pref2.overnight_guests:
        dealbreaker_score -= 20
    scores["dealbreakers"] = max(0, dealbreaker_score)
    
    # 8. Shared interests (bonus points)
    interests1 = set((pref1.interests or "").lower().split(","))
    interests2 = set((pref2.interests or "").lower().split(","))
    interests1 = {i.strip() for i in interests1 if i.strip()}
    interests2 = {i.strip() for i in interests2 if i.strip()}
    
    if interests1 and interests2:
        common_interests = interests1.intersection(interests2)
        interest_score = min(100, len(common_interests) * 25)
    else:
        interest_score = 50  # Neutral if no interests listed
    scores["interests"] = interest_score
    
    # Calculate weighted overall score
    overall_score = sum(scores[key] * weights[key] for key in scores)
    
    return {
        "overall": round(overall_score, 1),
        "breakdown": scores,
        "common_interests": list(interests1.intersection(interests2)) if interests1 and interests2 else []
    }


def get_best_matches_for_tenant(
    tenant_pref: TenantPreference, 
    candidate_prefs: List[TenantPreference], 
    top_n: int = 5
) -> List[Dict]:
    """
    Find best roommate matches for a tenant
    Returns list of matches sorted by compatibility score
    """
    matches = []
    
    for candidate_pref in candidate_prefs:
        if candidate_pref.tenant_id == tenant_pref.tenant_id:
            continue  # Skip self
        
        compatibility = calculate_compatibility_score(tenant_pref, candidate_pref)
        matches.append({
            "tenant_id": str(candidate_pref.tenant_id),
            "compatibility_score": compatibility["overall"],
            "breakdown": compatibility["breakdown"],
            "common_interests": compatibility.get("common_interests", [])
        })
    
    # Sort by compatibility score (highest first)
    matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
    
    return matches[:top_n]
