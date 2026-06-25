"""
AI Priority Classification Service for Support Requests
Uses local Ollama offline model (qwen2.5vl:3b) to analyze support requests and assign priority levels
"""

import re
import json
import logging
import requests
import multiprocessing
from django.conf import settings
from django.utils import timezone

OLLAMA_THREADS = min(4, max(1, multiprocessing.cpu_count() // 2))

logger = logging.getLogger(__name__)


class AIPriorityService:
    """AI-powered support request priority classification"""

    PRIORITY_MAP = {
        'urgent': {'days': 1, 'weight': 4, 'color': 'red'},
        'high': {'days': 3, 'weight': 3, 'color': 'orange'},
        'medium': {'days': 7, 'weight': 2, 'color': 'yellow'},
        'low': {'days': 14, 'weight': 1, 'color': 'green'},
    }

    def __init__(self):
        self.ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
        self.model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')

    def classify(self, support_request):
        """Main entry point - classify a support request priority using local Ollama"""
        
        # Build context for AI
        context = self._build_context(support_request)
        
        # Create prompt
        prompt = self._create_prompt(context)
        
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at classifying support request priorities for Scripture Union Rwanda.\n"
                            "Perform a rigorous word-by-word semantic analysis on the title and description to detect key urgency/priority words.\n"
                            "Analyze the request details and output a structured JSON response matching the requested schema.\n"
                            "Return ONLY valid JSON. Do not return any other text, warnings, markdown codeblocks (except raw json), or explanations."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json",
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 1024,
                    "num_predict": 120
                }
            }
            
            response = requests.post(
                f"{self.ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                content = response.json().get('message', {}).get('content', '').strip()
                result = self._parse_response(content)
                logger.info(f"AI classified request {getattr(support_request, 'id', 'draft')} as {result['priority']} ({result['confidence']}%)")
                return result
            else:
                logger.error(f"Ollama returned status {response.status_code}")
                return self._fallback_classification(support_request)
                
        except Exception as e:
            logger.error(f"AI classification failed: {e}")
            return self._fallback_classification(support_request)

    def _build_context(self, request):
        """Build comprehensive context for AI analysis"""
        
        # Get similar past requests for pattern learning
        similar = self._get_similar_requests(request)
        
        category_display = request.category
        if hasattr(request, 'get_category_display'):
            category_display = request.get_category_display()
            
        requester_role = 'staff'
        if hasattr(request, 'requester') and request.requester:
            requester_role = getattr(request.requester, 'role', 'staff')
            
        return {
            'title': request.title,
            'description': request.description,
            'category': category_display,
            'region': getattr(request, 'region', ''),
            'requester_role': requester_role,
            'similar_requests': similar,
            'time_of_month': self._get_time_of_month(),
            'is_deadline_season': self._is_deadline_season(),
        }

    def _get_similar_requests(self, request, limit=3):
        """Find similar past requests for AI to learn from"""
        from apps.support.models import SupportRequest
        
        req_id = getattr(request, 'id', None)
        try:
            similar = SupportRequest.objects.filter(
                category=request.category,
                status__in=['approved', 'fulfilled', 'closed']
            )
            if req_id:
                similar = similar.exclude(id=req_id)
            similar = similar.order_by('-created_at')[:limit]
            
            return [{
                'title': r.title[:50],
                'final_priority': r.ai_priority or r.urgency,
                'was_urgent': r.ai_priority == 'urgent' or r.urgency in ['critical', 'high']
            } for r in similar]
        except Exception:
            return []

    def _get_time_of_month(self):
        """Get position in month (early/mid/late)"""
        day = timezone.now().day
        if day <= 10: return 'early_month'
        if day <= 20: return 'mid_month'
        return 'late_month'

    def _is_deadline_season(self):
        """Check if it's reporting deadline season"""
        day = timezone.now().day
        return day >= 25  # Last week of month

    def _create_prompt(self, context):
        """Create the prompt sent to Ollama"""
        
        return f"""Analyze this support request for Scripture Union Rwanda and assign a priority (urgent/high/medium/low).
Please perform a meticulous word-by-word semantic analysis of the title and description below to identify priority indicators (e.g. emergency, budget deadline, nice to have).

REQUEST DETAILS:
- Title: {context['title']}
- Description: {context['description']}
- Category: {context['category']}
- Region: {context['region']}
- Requester Role: {context['requester_role']}
- Time in Month: {context['time_of_month']}
- Deadline Season: {context['is_deadline_season']}

SIMILAR PAST REQUESTS:
{json.dumps(context['similar_requests'], indent=2) if context['similar_requests'] else 'None'}

PRIORITY RULES:
- URGENT: Ministry stopping, safety issue, affects >100 people, needs action TODAY. Examples: Critical financial theft/loss, major safety emergency, core servers down.
- HIGH: Major activity affected, affects >50 people, needs THIS WEEK. Examples: Budget approvals for upcoming events, field coordinator shortage.
- MEDIUM: Important but not critical, affects 20-50 people, needs 2 WEEKS. Examples: Training resource requests, material supplies.
- LOW: Nice to have, minor impact, affects <20 people, can wait. Examples: Suggestion, minor equipment repair, prayer updates.

Return ONLY valid JSON matching this schema:
{{
    "priority": "urgent" or "high" or "medium" or "low",
    "confidence": 0-100 (integer representing percentage confidence),
    "reason": "Brief explanation (1-2 sentences) of why this priority was assigned based on details, numbers, or urgency",
    "key_factors": ["factor1", "factor2"]
}}"""

    def _parse_response(self, response_text):
        """Extract JSON from AI response"""
        try:
            # Find JSON in response
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                data = json.loads(response_text)
            
            # Validate priority
            priority = data.get('priority', 'medium').lower()
            if priority not in ['urgent', 'high', 'medium', 'low']:
                if 'crit' in priority:
                    priority = 'urgent'
                else:
                    priority = 'medium'
            
            return {
                'priority': priority,
                'confidence': min(100, max(0, int(data.get('confidence', 70)))),
                'reason': data.get('reason', 'AI analysis completed'),
                'key_factors': data.get('key_factors', []),
                'suggested_days': self.PRIORITY_MAP[priority]['days']
            }
            
        except Exception as e:
            logger.error(f"Parse error: {e} | Raw response was: {response_text}")
            return self._default_result()

    def classify_heuristics(self, request):
        """Highly advanced, fast keyword and context classifier scanning every word"""
        title = getattr(request, 'title', '') or ''
        description = getattr(request, 'description', '') or ''
        text = f"{title} {description}".lower()
        
        # Define rich lists of keywords for each priority level
        urgent_words = [
            'emergency', 'urgent', 'critical', 'immediate', 'safety', 'danger', 
            'stop', 'stolen', 'theft', 'crash', 'broken', 'accident', 'injury', 
            'sick', 'hospital', 'hazard', 'crisis', 'fire', 'leak', 'flooding', 
            'die', 'death', 'casualty', 'loss', 'damage', 'security', 'assault', 
            'incident', 'lockout', 'hack', 'breach', 'illegal', 'police', 'threat',
            'dying', 'killed', 'blood', 'burn', 'collapse', 'ruin'
        ]
        
        high_words = [
            'important', 'deadline', 'tomorrow', 'essential', 'vital', 'need', 
            'soon', 'priority', 'required', 'budget', 'funds', 'financial', 
            'shortage', 'missing', 'delay', 'approaching', 'approval', 'restrict', 
            'refuse', 'fail', 'warning', 'error', 'defect', 'flaw', 'malfunction',
            'necessary', 'upcoming', 'pending', 'review', 'verify'
        ]
        
        low_words = [
            'low', 'nice to have', 'future', 'eventually', 'when possible', 
            'suggestion', 'feedback', 'idea', 'minor', 'spacing', 'typo', 
            'cosmetic', 'draft', 'optional', 'placeholder', 'color', 'theme', 
            'font', 'alignment', 'wording', 'grammar', 'spelling', 'tweak',
            'ignore', 'slow', 'later', 'wishlist'
        ]
        
        # Check for word boundary matches to ensure precision
        matched_urgent = [w for w in urgent_words if re.search(r'\b' + re.escape(w) + r'\b', text)]
        matched_high = [w for w in high_words if re.search(r'\b' + re.escape(w) + r'\b', text)]
        matched_low = [w for w in low_words if re.search(r'\b' + re.escape(w) + r'\b', text)]
        
        category = getattr(request, 'category', 'Other') or 'Other'
        role = 'staff'
        if hasattr(request, 'requester') and request.requester:
            role = getattr(request.requester, 'role', 'staff')
            
        # Determine priority and confidence score based on matches and context
        if matched_urgent:
            priority = 'urgent'
            confidence = min(95, 75 + len(matched_urgent) * 5)
            reason = f"Urgent status match based on keyword(s): {', '.join(matched_urgent)}."
            factors = matched_urgent
        elif matched_high:
            priority = 'high'
            confidence = min(90, 65 + len(matched_high) * 5)
            reason = f"High priority matched key terms: {', '.join(matched_high)}."
            factors = matched_high
        elif category == 'Financial' and ('budget' in text or 'money' in text or 'cost' in text):
            priority = 'high'
            confidence = 70
            reason = "Financial category request with budget implications."
            factors = ['financial', 'budget']
        elif matched_low:
            priority = 'low'
            confidence = min(90, 60 + len(matched_low) * 5)
            reason = f"Low priority matched key terms: {', '.join(matched_low)}."
            factors = matched_low
        else:
            priority = 'medium'
            confidence = 50
            reason = "Medium priority (default, no specific priority terms matched)."
            factors = []
            
        # Adjust priority based on category/role if appropriate
        if priority == 'medium' and role in ['administrator', 'national_manager']:
            priority = 'high'
            confidence = 60
            reason += " Upgraded to High because request is submitted by administrator/manager."
            
        return {
            'priority': priority,
            'confidence': confidence,
            'reason': reason,
            'key_factors': factors,
            'suggested_days': self.PRIORITY_MAP[priority]['days']
        }

    def _fallback_classification(self, request):
        """Wrapper to call the advanced classify_heuristics method"""
        return self.classify_heuristics(request)

    def _default_result(self):
        """Default result for error cases"""
        return {'priority': 'medium', 'confidence': 50, 'reason': 'Default assignment', 'key_factors': [], 'suggested_days': 7}


# Singleton instance
ai_priority_service = AIPriorityService()
