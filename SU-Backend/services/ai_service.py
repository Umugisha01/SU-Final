import re
import json
from pydantic import BaseModel, Field
from typing import List
from django.conf import settings
from django.db import models
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import google.generativeai as genai

# Pydantic schema for structured output validation
class ReportAnalysisResult(BaseModel):
    category: str = Field(description="One of: 'Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program'")
    confidence: int = Field(description="Confidence score from 0 to 100 representing the certainty of classification")
    keywords: List[str] = Field(description="List of 3-7 key concepts or topic keywords extracted from the text")
    summary: str = Field(description="A concise 1-3 sentence summary of the activities, participants, and outcomes")


class AIService:
    """
    Integrates the Google Gemini API with fallback heuristic classification,
    PII scrubbing, real-time WebSocket progress updates, and a regional RAG assistant.
    """
    @staticmethod
    def stream_progress(report_id, percentage, status_message):
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"ai_progress_{report_id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "progress_update",
                    "data": {
                        "report_id": report_id,
                        "percentage": percentage,
                        "status": status_message
                    }
                }
            )

    @staticmethod
    def scrub_pii(text):
        if not text:
            return ""
        # Scrub emails
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
        # Scrub phone numbers (standard international and local Rwandan format)
        text = re.sub(r'\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', '[PHONE]', text)
        # Scrub names (basic cleaning of typical introductory name phrases)
        text = re.sub(r'\b(my name is|i am|names? of|represented by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', r'\1 [NAME]', text, flags=re.IGNORECASE)
        return text

    @staticmethod
    def run_heuristics(title, description):
        text = (title + " " + description).lower()
        
        mapping = [
            (r'youth|child|young|teen|kid|student|school', 'Youth Program'),
            (r'bible|scripture|study|verse|reading|lesson|teach', 'Bible Study'),
            (r'outreach|evangelism|crusade|street|gospel|witness', 'Outreach'),
            (r'train|capacity|seminar|workshop|learn|class|coach', 'Training'),
            (r'meeting|committee|board|admin|session|council', 'Meeting'),
            (r'community|event|service|help|aid|village|poor', 'Community Event'),
            (r'pray|intercess|fast|worship|chapel|altar', 'Prayer Meeting')
        ]
        
        category = 'Outreach'  # Default fallback
        for pattern, cat in mapping:
            if re.search(pattern, text):
                category = cat
                break
        
        # Simple keyword extraction
        words = re.findall(r'\b\w{5,}\b', text)
        stop_words = ['about', 'their', 'there', 'would', 'could', 'should', 'under', 'these', 'those']
        keywords = list(set([w for w in words if w not in stop_words]))[:5]
        
        summary = f"Heuristic Fallback: {description[:120]}..." if len(description) > 120 else f"Heuristic Fallback: {description}"
        
        return {
            "category": category,
            "confidence": 60,
            "keywords": keywords,
            "summary": summary
        }

    @staticmethod
    def analyze_report(report_id):
        # Local imports to prevent circular references
        from apps.reports.models import Report
        
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return None

        # 25% - Initialization
        AIService.stream_progress(report.id, 25, "Initializing report analysis...")
        
        raw_text = f"Title: {report.title}\nDescription: {report.description}\nOutcomes: {report.outcomes or ''}"
        scrubbed_text = AIService.scrub_pii(raw_text)
        
        # 50% - Connecting/Processing
        AIService.stream_progress(report.id, 50, "Connecting to Gemini API...")
        
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            # 75% - Fallback Engine
            AIService.stream_progress(report.id, 75, "API Key missing, running heuristic fallback...")
            fallback_res = AIService.run_heuristics(report.title, report.description)
            
            report.ai_category = fallback_res['category']
            report.confidence = fallback_res['confidence']
            report.keywords = fallback_res['keywords']
            report.ai_summary = fallback_res['summary']
            report.save()
            
            # 100% - Finished
            AIService.stream_progress(report.id, 100, "Analysis complete using fallback heuristics.")
            return report

        try:
            genai.configure(api_key=gemini_key)
            # Use gemini-1.5-flash for speed and reliability
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Analyze the following report and categorize it into EXACTLY one of the following types:
            'Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program'.
            
            Provide the output strictly in a JSON format matching this schema:
            {{
                "category": "The classified type",
                "confidence": 0-100 (integer representing certainty),
                "keywords": ["list", "of", "3-5", "keywords"],
                "summary": "1-2 sentence executive summary of the report description and outcomes"
            }}
            
            Report content to analyze:
            {scrubbed_text}
            """
            
            # 75% - Processing API Response
            AIService.stream_progress(report.id, 75, "Generating classification analysis...")
            
            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.0, "response_mime_type": "application/json"}
            )
            
            result_json = json.loads(response.text.strip())
            
            # Validate with Pydantic
            validated = ReportAnalysisResult(**result_json)
            
            report.ai_category = validated.category
            report.confidence = validated.confidence
            report.keywords = validated.keywords
            report.ai_summary = validated.summary
            report.save()
            
            # 100% - Finished
            AIService.stream_progress(report.id, 100, "Analysis complete.")
        
        except Exception as e:
            # On any connection or parsing exception, trigger fallback
            AIService.stream_progress(report.id, 75, f"Gemini API failure: {str(e)}. Triggering heuristics fallback...")
            fallback_res = AIService.run_heuristics(report.title, report.description)
            
            report.ai_category = fallback_res['category']
            report.confidence = fallback_res['confidence']
            report.keywords = fallback_res['keywords']
            report.ai_summary = fallback_res['summary']
            report.save()
            
            AIService.stream_progress(report.id, 100, "Analysis complete using fallback heuristics due to API failure.")
            
        return report

    @staticmethod
    def detect_trends():
        """
        Weekly analysis of the reports submitted in the last 30 days to detect trends.
        """
        from apps.reports.models import Report
        from django.utils import timezone
        from datetime import timedelta
        
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_reports = Report.objects.filter(status='approved', date__gte=thirty_days_ago)
        
        if not recent_reports.exists():
            return "No reports available in the last 30 days to detect trends."
            
        context_data = []
        for r in recent_reports:
            context_data.append(f"[{r.region} - {r.type}] {r.title}: {r.ai_summary or r.description[:100]}")
            
        reports_summary = "\n".join(context_data)
        
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            return "Unable to run Trend Detection: Gemini API Key is missing."
            
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following weekly summaries of activities in Scripture Union Rwanda and identify 3 core operational or spiritual trends, challenges, or patterns.
            Provide output in clean Markdown.
            
            Reports of the last 30 days:
            {reports_summary}
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error occurred during trend detection run: {e}"

    @staticmethod
    def generate_consolidated_summary(report_ids):
        """
        Generates an executive summary based on a list of report IDs.
        """
        from apps.reports.models import Report
        reports = Report.objects.filter(id__in=report_ids)
        
        if not reports.exists():
            return "No reports selected."
            
        context_lines = []
        for r in reports:
            context_lines.append(f"- {r.title} ({r.region}, Type: {r.type}, Participants: {r.participants}): {r.description[:150]}")
            
        reports_content = "\n".join(context_lines)
        
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            # Return a simple mock summary
            return f"Heuristic Summary: Compiled {reports.count()} reports representing {sum(r.participants for r in reports)} participants across regions."
            
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Create a professional, executive-level consolidated summary based on the following regional activity reports. 
            Highlight overall numbers, themes, and significant outcomes.
            
            Reports:
            {reports_content}
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Heuristic Summary: Failed to query LLM due to {e}."

    @staticmethod
    def chat_assistant(user, user_message):
        """
        RAG Chat assistant that queries database items visible to the user's role and region,
        and uses Gemini to answer queries.
        """
        from apps.reports.models import Report
        
        # Enforce regional isolation for RAG data loading
        if user.role in ['staff', 'coordinator']:
            reports = Report.objects.filter(region=user.region)
        else:
            reports = Report.objects.all()
            
        # Select latest 10 reports as context
        latest_reports = reports.order_by('-date')[:10]
        context_lines = []
        for r in latest_reports:
            context_lines.append(f"[{r.region}] {r.title} ({r.type}): {r.ai_summary or r.description[:100]}")
            
        context_str = "\n".join(context_lines)
        
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            return "Chat Assistant: I am currently offline because the AI Service credentials are not set."
            
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are the SU Connect AI assistant. Answer the user's question about Scripture Union Rwanda activities.
            Use the following context of recent reports (which matches the user's regional access limits) to inform your answer.
            If the context does not contain the answer, answer based on general Scripture Union knowledge but mention the lack of specific local data.
            
            User Region: {user.region}
            User Role: {user.role}
            
            Context (recent reports):
            {context_str}
            
            User Question: {user_message}
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Chat Assistant: Sorry, I encountered an issue while generating an answer: {e}"
