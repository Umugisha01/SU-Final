import re
import json
from pydantic import BaseModel, Field
from typing import List
from django.conf import settings
from django.db import models
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import google.generativeai as genai

# Pydantic schema for structured output validation
class ReportAnalysisResult(BaseModel):
    category: str = Field(description="One of: 'Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program'")
    confidence: int = Field(description="Confidence score from 0 to 100 representing the certainty of classification")
    keywords: List[str] = Field(description="List of 3-7 key concepts or topic keywords extracted from the text")
    summary: str = Field(description="A concise 1-3 sentence summary of the activities, participants, and outcomes")

_reference_qa_cache = None

def normalize_text(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def load_reference_qa():
    import os
    import re
    from django.conf import settings
    from pathlib import Path

    qa_dict = {}
    try:
        # settings.BASE_DIR is SU-Backend, the files are in parent dir
        workspace_dir = Path(settings.BASE_DIR).parent
        files = [
            workspace_dir / "su_connect_full_project_qa.md",
            workspace_dir / "project-questions-for-chapters-3-and-4.md"
        ]
        
        # Matches ### Q1. ... or ### 1. ...
        question_re = re.compile(r'^###\s+(?:Q)?(\d+)\.\s*(.*)$')
        
        for file_path in files:
            if not os.path.exists(file_path):
                continue
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            lines = content.split("\n")
            current_q = None
            current_ans_lines = []
            
            for line in lines:
                stripped = line.strip()
                match = question_re.match(stripped)
                if match:
                    if current_q and current_ans_lines:
                        ans_text = "\n".join(current_ans_lines).strip()
                        qa_dict[current_q] = ans_text
                    current_q = match.group(2).strip()
                    current_ans_lines = []
                elif current_q is not None:
                    if stripped.startswith("---") or stripped.startswith("# "):
                        ans_text = "\n".join(current_ans_lines).strip()
                        qa_dict[current_q] = ans_text
                        current_q = None
                        current_ans_lines = []
                    else:
                        current_ans_lines.append(line)
            
            if current_q and current_ans_lines:
                ans_text = "\n".join(current_ans_lines).strip()
                qa_dict[current_q] = ans_text
    except Exception:
        pass
    return qa_dict

def get_reference_qa():
    global _reference_qa_cache
    if _reference_qa_cache is None:
        _reference_qa_cache = load_reference_qa()
    return _reference_qa_cache

def find_matching_qa(user_message):
    qa_dict = get_reference_qa()
    if not qa_dict:
        return None
        
    normalized_user = normalize_text(user_message)
    if not normalized_user:
        return None
        
    # 1. Exact match on normalized text
    for q_text, ans_text in qa_dict.items():
        if normalized_user == normalize_text(q_text):
            return ans_text
            
    # 2. Check if normalized question is inside normalized user message (or vice versa)
    for q_text, ans_text in qa_dict.items():
        norm_q = normalize_text(q_text)
        if len(norm_q) > 12 and norm_q in normalized_user:
            return ans_text
        if len(normalized_user) > 12 and normalized_user in norm_q:
            return ans_text
            
    # 3. Token keyword matching
    user_tokens = set(normalized_user.split())
    stop_words = {
        'what', 'is', 'are', 'the', 'of', 'and', 'to', 'in', 'for', 'a', 'an', 'your', 'my', 'system', 'you',
        'please', 'tell', 'me', 'explain', 'describe', 'show', 'list', 'about', 'how', 'does', 'do', 'any'
    }
    user_keywords = user_tokens - stop_words
    
    if len(user_keywords) >= 2:
        best_match = None
        best_ratio = 0.0
        best_overlap_len = 0
        
        for q_text, ans_text in qa_dict.items():
            norm_q = normalize_text(q_text)
            q_tokens = set(norm_q.split())
            q_keywords = q_tokens - stop_words
            
            if not q_keywords:
                continue
                
            overlap = user_keywords.intersection(q_keywords)
            smaller_len = min(len(q_keywords), len(user_keywords))
            ratio = len(overlap) / smaller_len if smaller_len > 0 else 0.0
            
            if ratio > best_ratio or (ratio == best_ratio and len(overlap) > best_overlap_len):
                best_ratio = ratio
                best_match = ans_text
                best_overlap_len = len(overlap)
                
        if best_ratio >= 0.75:
            return best_match
            
    return None


class AIService:
    """
    Integrates the Google Gemini API with fallback local Ollama dynamic routing,
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
    def extract_text_from_document(document):
        import os
        from django.conf import settings
        
        file_path = os.path.join(settings.MEDIA_ROOT, document.storage_key)
        if not os.path.exists(file_path):
            return f"[Document {document.name} (File not found on disk)]"
            
        ext = document.name.split('.')[-1].lower() if '.' in document.name else ''
        
        # 1. Plain text files
        if ext in ['txt', 'md', 'csv', 'json', 'xml']:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()[:5000]
            except Exception as e:
                return f"[Error reading text file {document.name}: {e}]"
                
        # 2. PDF Files
        elif ext == 'pdf':
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                text = ""
                for page in reader.pages[:10]:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text[:5000]
            except ImportError:
                return f"[PDF parsing library 'pypdf' not installed. Document Name: {document.name}]"
            except Exception as e:
                return f"[Error parsing PDF document {document.name}: {e}]"
                
        # 3. Word DOCX Files
        elif ext == 'docx':
            try:
                import docx
                doc = docx.Document(file_path)
                text = []
                for para in doc.paragraphs:
                    text.append(para.text)
                return "\n".join(text)[:5000]
            except ImportError:
                return f"[Word parsing library 'python-docx' not installed. Document Name: {document.name}]"
            except Exception as e:
                return f"[Error parsing Word document {document.name}: {e}]"
                
        # 4. Excel spreadsheet metadata (xlsx)
        elif ext == 'xlsx':
            try:
                import openpyxl
                wb = openpyxl.load_workbook(file_path, read_only=True)
                sheet_names = wb.sheetnames
                return f"[Excel Spreadsheet: {document.name}. Sheets: {', '.join(sheet_names)}]"
            except ImportError:
                return f"[Spreadsheet parsing library 'openpyxl' not installed. Document Name: {document.name}]"
            except Exception as e:
                return f"[Error reading Excel sheet {document.name}: {e}]"
                
        # 5. Image Files
        elif ext in ['jpg', 'jpeg', 'png']:
            return f"[Image File: {document.name}]"
            
        return f"[Unsupported file type: {document.name}]"

    @staticmethod
    def analyze_report(report_id):
        # Local imports to prevent circular references
        from apps.reports.models import Report
        import requests
        
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return None

        # 25% - Initialization
        AIService.stream_progress(report.id, 25, "Initializing report analysis...")
        
        raw_text = f"Title: {report.title}\nDescription: {report.description}\nOutcomes: {report.outcomes or ''}"
        scrubbed_text = AIService.scrub_pii(raw_text)
        
        # Helper to run analysis using local Ollama model
        def run_ollama_analysis():
            ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
            ollama_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            
            # Format report content richly with all fields
            demo = report.demographics or {}
            male = demo.get('male', 0)
            female = demo.get('female', 0)
            youth = demo.get('youth', 0)
            adults = demo.get('adults', 0)
            
            # Extract content from attached supporting documents
            documents_content = []
            if hasattr(report, 'documents') and report.documents.exists():
                for doc in report.documents.all():
                    doc_text = AIService.extract_text_from_document(doc)
                    documents_content.append(f"--- ATTACHED FILE: {doc.name} ---\n{doc_text}\n")
            docs_str = "\n".join(documents_content) if documents_content else "No supporting documents attached."
            
            report_details = (
                f"Title: {report.title}\n"
                f"Region: {report.region}\n"
                f"Department: {report.department}\n"
                f"Date: {report.date}\n"
                f"Duration: {report.duration or 'N/A'}\n"
                f"Location: {report.location or 'N/A'}\n"
                f"Participants Count: {report.participants}\n"
                f"Demographics: Male: {male}, Female: {female}, Youth: {youth}, Adults: {adults}\n"
                f"Activity Description: {report.description}\n"
                f"Outcomes & Impact: {report.outcomes or 'None'}\n"
                f"Challenges Encountered: {report.challenges or 'None'}\n"
                f"Prayer Requests: {report.prayer_requests or 'None'}\n"
                f"Supporting Documents Content:\n{docs_str}\n"
            )
            
            scrubbed_details = AIService.scrub_pii(report_details)
            
            system_prompt = (
                "You are SU-Connect AI, the assistant for Scripture Union Rwanda. You extract structured analysis from reports. "
                "Analyze the provided activity report and output a structured JSON response. "
                "Categorize the report into EXACTLY one of these types: "
                "'Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program'. "
                "Provide a confidence score (0-100), a list of 3-7 keywords, and a real executive summary (1-2 sentences) of the whole report including description, outcomes, and metrics.\n"
                "Return ONLY a JSON object matching this schema:\n"
                "{\n"
                "  \"category\": \"string (exactly one of the allowed categories)\",\n"
                "  \"confidence\": int,\n"
                "  \"keywords\": [\"list\", \"of\", \"keywords\"],\n"
                "  \"summary\": \"string (1-2 sentence executive summary of the whole report)\"\n"
                "}"
            )
            
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Report Content:\n{scrubbed_details}"}
                ],
                "stream": False,
                "format": "json",
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 4096,
                    "num_predict": 400
                }
            }
            
            response = requests.post(
                f"{ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=90
            )
            if response.status_code == 200:
                content = response.json().get('message', {}).get('content', '').strip()
                res = json.loads(content)
                category = res.get('category', 'Outreach')
                allowed_cats = ['Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program']
                if category not in allowed_cats:
                    category = 'Outreach'
                return {
                    "category": category,
                    "confidence": int(res.get('confidence', 80)),
                    "keywords": list(res.get('keywords', [])),
                    "summary": res.get('summary', '').strip()
                }
            raise Exception(f"Ollama returned status {response.status_code}")

        # 50% - Connecting/Processing
        AIService.stream_progress(report.id, 50, "Connecting to API...")
        
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            # 75% - Fallback to Ollama
            AIService.stream_progress(report.id, 75, "Gemini API key missing. Connecting to local Ollama...")
            try:
                res = run_ollama_analysis()
                report.ai_category = res['category']
                report.confidence = res['confidence']
                report.keywords = res['keywords']
                report.ai_summary = res['summary']
                report.save()
                AIService.stream_progress(report.id, 100, "Analysis complete using local Ollama model.")
                return report
            except Exception as e:
                AIService.stream_progress(report.id, 75, f"Ollama execution failed ({e}), running heuristic fallback...")
                fallback_res = AIService.run_heuristics(report.title, report.description)
                report.ai_category = fallback_res['category']
                report.confidence = fallback_res['confidence']
                report.keywords = fallback_res['keywords']
                report.ai_summary = fallback_res['summary']
                report.save()
                AIService.stream_progress(report.id, 100, "Analysis complete using fallback heuristics due to local LLM failure.")
                return report

        try:
            genai.configure(api_key=gemini_key)
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
            # On any connection or parsing exception, trigger Ollama fallback
            AIService.stream_progress(report.id, 75, f"Gemini API failure: {str(e)}. Triggering local Ollama fallback...")
            try:
                res = run_ollama_analysis()
                report.ai_category = res['category']
                report.confidence = res['confidence']
                report.keywords = res['keywords']
                report.ai_summary = res['summary']
                report.save()
                AIService.stream_progress(report.id, 100, "Analysis complete using local Ollama fallback model.")
            except Exception as ex:
                AIService.stream_progress(report.id, 75, f"Ollama fallback failure: {str(ex)}. Triggering heuristics fallback...")
                fallback_res = AIService.run_heuristics(report.title, report.description)
                report.ai_category = fallback_res['category']
                report.confidence = fallback_res['confidence']
                report.keywords = fallback_res['keywords']
                report.ai_summary = fallback_res['summary']
                report.save()
                AIService.stream_progress(report.id, 100, "Analysis complete using fallback heuristics due to API and LLM failure.")
                
        return report

    @staticmethod
    def detect_trends():
        """
        Weekly analysis of the reports submitted in the last 30 days to detect trends.
        """
        from apps.reports.models import Report
        from django.utils import timezone
        from datetime import timedelta
        import requests
        
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_reports = Report.objects.filter(status='approved', date__gte=thirty_days_ago, is_deleted=False)
        
        if not recent_reports.exists():
            return "No reports available in the last 30 days to detect trends."
            
        context_data = []
        for r in recent_reports:
            context_data.append(f"[{r.region} - {r.type}] {r.title}: {r.ai_summary or r.description[:100]}")
            
        reports_summary = "\n".join(context_data)
        
        def run_ollama_trends():
            ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
            ollama_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            
            system_prompt = (
                "You are SU-Connect AI, the assistant for Scripture Union Rwanda. "
                "Analyze the provided summaries of activities and identify 3 core operational or spiritual trends, challenges, or patterns. "
                "Output the results in clean Markdown format."
            )
            
            user_prompt = (
                f"Reports of the last 30 days:\n{reports_summary}\n\n"
                "Trends and Observations:"
            )
            
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False,
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.3,
                    "num_ctx": 4096,
                    "num_predict": 1000
                }
            }
            response = requests.post(
                f"{ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=180
            )
            if response.status_code == 200:
                return response.json().get('message', {}).get('content', '').strip()
            raise Exception(f"Ollama returned status {response.status_code}")
            
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            try:
                return run_ollama_trends()
            except Exception as e:
                return f"Unable to run Trend Detection: Gemini key missing and local Ollama execution failed: {e}"
            
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
            try:
                return run_ollama_trends()
            except Exception as ex:
                return f"Error occurred during trend detection run: {e}. Local Ollama fallback also failed: {ex}"

    @staticmethod
    def generate_consolidated_summary(report_ids):
        """
        Generates an executive summary based on a list of report IDs.
        """
        from apps.reports.models import Report
        import requests
        
        reports = Report.objects.filter(id__in=report_ids)
        
        if not reports.exists():
            return "No reports selected."
            
        context_lines = []
        for r in reports:
            context_lines.append(f"- {r.title} ({r.region}, Type: {r.type}, Participants: {r.participants}): {r.description[:150]}")
            
        reports_content = "\n".join(context_lines)
        
        def run_ollama_summary():
            ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
            ollama_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            
            system_prompt = (
                "You are SU-Connect AI, the assistant for Scripture Union Rwanda. "
                "Your task is to create a professional, executive-level consolidated summary based on a list of activity reports. "
                "Highlight overall numbers, themes, and significant outcomes. Be concise (1-2 short paragraphs). "
                "Focus strictly on the summary of the provided reports content."
            )
            
            user_prompt = (
                f"Reports:\n{reports_content}\n\n"
                "Consolidated Summary:"
            )
            
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False,
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.3,
                    "num_ctx": 4096,
                    "num_predict": 400
                }
            }
            response = requests.post(
                f"{ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=180
            )
            if response.status_code == 200:
                return response.json().get('message', {}).get('content', '').strip()
            raise Exception(f"Ollama returned status {response.status_code}")
            
        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            try:
                return run_ollama_summary()
            except Exception:
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
            try:
                return run_ollama_summary()
            except Exception:
                return f"Heuristic Summary: Failed to query LLM due to {e}. Fallback to compiled metrics."

    @staticmethod
    def chat_assistant(user, user_message, document_ids=None, report_ids=None, stream=False, model_override=None):
        """
        RAG Chat assistant that queries database items visible to the user's role and region,
        and uses local Ollama model to answer queries.
        
        If images are attached, route to settings.OLLAMA_VISION_MODEL (qwen2.5vl:3b).
        Otherwise, route to settings.OLLAMA_TEXT_MODEL (mistral:7b-instruct-q4_K_M).
        """
        from apps.reports.models import Report
        import requests
        import base64
        import os
        from django.conf import settings
        from django.db.models import Q
        
        ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
        citations = []
        
        # Check for direct match in reference Q&As
        if not document_ids and not report_ids:
            matched_qa = find_matching_qa(user_message)
            if matched_qa:
                if stream:
                    def qa_stream_generator():
                        yield json.dumps({"citations": []}) + "\n"
                        yield json.dumps({"content": matched_qa}) + "\n"
                    return qa_stream_generator()
                return matched_qa, []

        # 1. Load attached documents / images
        explicit_docs_content = []
        images_list = []
        
        if document_ids:
            from apps.documents.models import Document
            # Use base manager to fetch documents (even if soft deleted or if isolation is bypassed)
            docs = Document._base_manager.filter(id__in=document_ids)
            for doc in docs:
                ext = doc.name.split('.')[-1].lower() if '.' in doc.name else ''
                if ext in ['jpg', 'jpeg', 'png']:
                    img_path = os.path.join(settings.MEDIA_ROOT, doc.storage_key)
                    if os.path.exists(img_path):
                        try:
                            from PIL import Image
                            import io
                            
                            with Image.open(img_path) as img:
                                if img.mode != 'RGB':
                                    img = img.convert('RGB')
                                max_size = 224
                                if img.width > max_size or img.height > max_size:
                                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                                buffer = io.BytesIO()
                                img.save(buffer, format='JPEG', quality=50)
                                b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                                images_list.append(b64_data)
                                explicit_docs_content.append(f"[Image: {doc.name}]")
                        except Exception as e:
                            explicit_docs_content.append(f"[Image: {doc.name} - failed to process: {e}]")
                else:
                    doc_text = AIService.extract_text_from_document(doc)
                    explicit_docs_content.append(f"--- ATTACHED FILE: {doc.name} ---\n{doc_text}\n")
                    
        # Determine the model dynamically based on image presence
        if images_list:
            text_only_models = {
                'mistral:7b-instruct-q4_K_M',
                getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            }
            if model_override in text_only_models:
                advice_msg = (
                    "⚠️ I noticed you are trying to use the **Mistral (7B)** model to analyze an image or visual file. "
                    "Mistral is a text-only model and does not support image analysis. "
                    "Please switch to **Qwen-2.5-VL (Fast 3B)** in the dropdown above to analyze photos or visual things!"
                )
                if stream:
                    def advice_stream_generator():
                        yield json.dumps({"citations": []}) + "\n"
                        yield json.dumps({"content": advice_msg}) + "\n"
                    return advice_stream_generator()
                return advice_msg, []
                
            ollama_model = getattr(settings, 'OLLAMA_VISION_MODEL', 'qwen2.5vl:3b')
        elif model_override:
            ollama_model = model_override
        else:
            ollama_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            
        # 2a. Vision path: if images exist, skip RAG to keep context small
        if images_list:
            file_note = "\n".join(explicit_docs_content)
            system_prompt = (
                "You are SU-Connect AI, the assistant for Scripture Union Rwanda. "
                "The user has attached an image. Analyze it carefully and answer their question "
                "in a helpful, friendly, and professional manner. "
                "Describe what you see, comment on the content, and relate it to ministry activities if relevant. "
                "If the user asks for a detailed explanation, analysis, or text extraction, you MUST provide a detailed, comprehensive, high-quality response. "
                "If the user specifies custom instructions or overrides (the 'law of the user'), prioritize and obey those instructions."
            )
            user_prompt = f"{user_message}\n\n{file_note}".strip()
            
            if stream:
                def vision_stream_generator():
                    try:
                        # Yield empty citations first
                        yield json.dumps({"citations": []}) + "\n"
                        payload = {
                            "model": ollama_model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt, "images": images_list}
                            ],
                            "stream": True,
                            "keep_alive": "1h",
                            "options": {
                                "temperature": 0.2,
                                "num_ctx": 1024,
                                "num_predict": 250
                            }
                        }
                        response = requests.post(
                            f"{ollama_url.rstrip('/')}/api/chat",
                            json=payload,
                            stream=True,
                            timeout=600
                        )
                        if response.status_code == 200:
                            for line in response.iter_lines():
                                if line:
                                    chunk = json.loads(line.decode('utf-8'))
                                    content = chunk.get('message', {}).get('content', '')
                                    if content:
                                        yield json.dumps({"content": content}) + "\n"
                        else:
                            yield json.dumps({"error": f"AI error: Ollama returned status {response.status_code}. Please try again."}) + "\n"
                    except requests.exceptions.Timeout:
                        yield json.dumps({"error": "⏱ The AI took too long to process the image. This usually means the model is still loading into memory. Please wait 30 seconds and try again."}) + "\n"
                    except requests.exceptions.ConnectionError:
                        yield json.dumps({"error": "⚠ Could not connect to Ollama. Please open a terminal and run: ollama serve"}) + "\n"
                    except requests.exceptions.RequestException as e:
                        yield json.dumps({"error": f"⚠ Image analysis failed: {e}"}) + "\n"
                return vision_stream_generator()
            
            try:
                payload = {
                    "model": ollama_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt, "images": images_list}
                    ],
                    "stream": False,
                    "keep_alive": "1h",
                    "options": {
                        "temperature": 0.2,
                        "num_ctx": 1024,
                        "num_predict": 100
                    }
                }
                response = requests.post(
                    f"{ollama_url.rstrip('/')}/api/chat",
                    json=payload,
                    timeout=600
                )
                if response.status_code == 200:
                    return response.json().get('message', {}).get('content', '').strip(), []
                else:
                    return f"AI error: Ollama returned status {response.status_code}. Please try again.", []
            except requests.exceptions.Timeout:
                return (
                    "⏱ The AI took too long to process the image. "
                    "This usually means the model is still loading into memory. "
                    "Please wait 30 seconds and try again."
                ), []
            except requests.exceptions.ConnectionError:
                return "⚠ Could not connect to Ollama. Please open a terminal and run: ollama serve", []
            except requests.exceptions.RequestException as e:
                return f"⚠ Image analysis failed: {e}", []
                
        # 2b. Text/Document path: compile RAG context and user database info
        is_greeting = user_message.lower().strip('!?., ') in {
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'yo', 'welcome'
        }

        profile_info = ""
        notifications_str = ""
        support_str = ""
        prayer_str = ""
        reports_stat_str = ""
        context_str = ""

        if user.role in ['field_officer', 'regional_coordinator']:
            reports = Report.objects.filter(region=user.region, is_deleted=False)
        else:
            reports = Report.objects.filter(is_deleted=False)

        if is_greeting:
            context_str = "No reports needed for simple greeting."
            profile_info = (
                f"Active User Profile:\n"
                f"- Name: {user.name}\n"
                f"- Email: {user.email}\n"
                f"- Role: {user.role}\n"
                f"- Region: {getattr(user, 'region', 'N/A')}\n"
            )
            notifications_str = "No notifications compiled for greeting."
            support_str = "No support requests compiled for greeting."
            prayer_str = "No prayer requests compiled for greeting."
            reports_stat_str = "No stats compiled for greeting."
        else:
            selected_reports = []
            if report_ids:
                selected_reports = list(reports.filter(id__in=report_ids))
            else:
                # Simple RAG search keyword matching
                stop_words = {
                    'the', 'and', 'for', 'this', 'that', 'with', 'from', 'give', 'more', 'some', 'about',
                    'report', 'outcomes', 'challenges', 'prayer', 'date', 'duration', 'summary',
                    'description', 'attendance', 'details', 'statistics', 'participants', 'location',
                    'what', 'where', 'when', 'who', 'how', 'please', 'tell', 'info', 'information'
                }
                words = [w.strip() for w in re.split(r'\W+', user_message) if len(w.strip()) > 2]
                words = [w for w in words if w.lower() not in stop_words]
                
                if words:
                    query = Q()
                    for word in words:
                        query |= (
                            Q(title__icontains=word) |
                            Q(region__icontains=word) |
                            Q(location__icontains=word) |
                            Q(submitted_by__name__icontains=word) |
                            Q(documents__name__icontains=word)
                        )
                    matching_reports = reports.filter(query).distinct()
                    if matching_reports.exists():
                        selected_reports = list(matching_reports.order_by('-date')[:2])
                
                if not selected_reports:
                    selected_reports = list(reports.order_by('-date')[:2])
                    
            for r in selected_reports:
                citations.append({
                    "id": r.id,
                    "title": r.title,
                    "date": str(r.date),
                    "region": r.region,
                    "type": r.type,
                    "location": r.location or "N/A",
                    "participants": r.participants
                })
                    
            context_lines = []
            for r in selected_reports:
                demo = r.demographics or {}
                male = demo.get('male', 0)
                female = demo.get('female', 0)
                youth = demo.get('youth', 0)
                adults = demo.get('adults', 0)
                
                desc = r.description[:250] + "..." if len(r.description) > 250 else r.description
                outcomes = (r.outcomes[:200] + "...") if r.outcomes and len(r.outcomes) > 200 else (r.outcomes or 'None reported.')
                challenges = (r.challenges[:200] + "...") if r.challenges and len(r.challenges) > 200 else (r.challenges or 'None reported.')
                prayer = (r.prayer_requests[:200] + "...") if r.prayer_requests and len(r.prayer_requests) > 200 else (r.prayer_requests or 'None.')
                
                documents_content = []
                if hasattr(r, 'documents') and r.documents.exists():
                    for doc in r.documents.all():
                        ext = doc.name.split('.')[-1].lower() if '.' in doc.name else ''
                        if ext not in ['jpg', 'jpeg', 'png']:
                            doc_text = AIService.extract_text_from_document(doc)
                            documents_content.append(f"--- ATTACHED FILE: {doc.name} ---\n{doc_text}\n")
                docs_str = "\n".join(documents_content) if documents_content else "No supporting documents."
                
                context_lines.append(
                    f"--- REPORT: {r.title} ---\n"
                    f"Date: {r.date} | Region: {r.region} | Type: {r.type}\n"
                    f"Location: {r.location or 'N/A'} | Attendance: Total {r.participants}\n"
                    f"Description: {desc}\n"
                    f"Outcomes: {outcomes}\n"
                    f"Challenges: {challenges}\n"
                    f"Prayer: {prayer}\n"
                )
                
            # Search reference Q&As for keyword overlap and add matches to context
            related_qa_lines = []
            qa_dict = get_reference_qa()
            if qa_dict:
                user_tokens = set(normalize_text(user_message).split())
                stop_words_qa = {
                    'what', 'is', 'are', 'the', 'of', 'and', 'to', 'in', 'for', 'a', 'an', 'your', 'my', 'system', 'you',
                    'please', 'tell', 'me', 'explain', 'describe', 'show', 'list', 'about', 'how', 'does', 'do', 'any'
                }
                user_keywords = user_tokens - stop_words_qa
                if user_keywords:
                    matched_qas = []
                    for q_text, ans_text in qa_dict.items():
                        norm_q = normalize_text(q_text)
                        q_keywords = set(norm_q.split()) - stop_words_qa
                        overlap = user_keywords.intersection(q_keywords)
                        if overlap:
                            matched_qas.append((len(overlap), q_text, ans_text))
                    
                    matched_qas.sort(key=lambda x: x[0], reverse=True)
                    for count, q_text, ans_text in matched_qas[:2]:
                        if count >= 2 or (len(user_keywords) == 1 and count >= 1):
                            related_qa_lines.append(f"Q: {q_text}\nA: {ans_text}")
            
            if related_qa_lines:
                context_str += "=== PROJECT REFERENCE QUESTIONS & ANSWERS ===\n"
                context_str += "\n\n".join(related_qa_lines) + "\n\n"

            if explicit_docs_content:
                context_str += "=== USER-ATTACHED FILES ===\n"
                context_str += "\n".join(explicit_docs_content) + "\n\n"
                
            context_str += "=== RELEVANT REPORTS ===\n"
            context_str += "\n".join(context_lines) if context_lines else "No recent reports available."
            
            try:
                profile_info = (
                    f"Active User Profile:\n"
                    f"- Name: {user.name}\n"
                    f"- Email: {user.email}\n"
                    f"- Role: {user.role}\n"
                    f"- Region: {getattr(user, 'region', 'N/A')}\n"
                )
                
                # Fetch user notifications (limit to 2)
                from apps.notifications.models import Notification
                notifs = Notification.objects.filter(user=user).order_by('-created_at')[:2]
                notif_list = []
                for n in notifs:
                    date_str = n.created_at.strftime('%Y-%m-%d') if n.created_at else 'N/A'
                    status = 'Read' if n.is_read else 'Unread'
                    notif_list.append(f"- [{date_str}] {n.message} ({status})")
                notifications_str = "\n".join(notif_list) if notif_list else "No notifications."
                
                # Fetch support requests (limit to 2)
                from apps.support.models import SupportRequest
                if user.role in ['field_officer', 'regional_coordinator']:
                    support_qs = SupportRequest.objects.filter(Q(requester=user) | Q(assigned_to=user)).order_by('-created_at')[:2]
                else:
                    support_qs = SupportRequest.objects.all().order_by('-created_at')[:2]
                support_list = []
                for s in support_qs:
                    date_str = s.created_at.strftime('%Y-%m-%d') if s.created_at else 'N/A'
                    support_list.append(
                        f"- [{date_str}] Category: {s.category} | Title: {s.title} | Status: {s.status} | Urgency: {s.urgency}"
                    )
                support_str = "\n".join(support_list) if support_list else "No support requests."
                
                # Fetch prayer requests (limit to 2)
                from apps.prayer.models import PrayerRequest
                prayer_qs = PrayerRequest.objects.all().order_by('-created_at')[:2]
                prayer_list = []
                for p in prayer_qs:
                    date_str = p.created_at.strftime('%Y-%m-%d') if p.created_at else 'N/A'
                    prayer_list.append(
                        f"- [{date_str}] Title: {p.title} | Status: {p.status}"
                    )
                prayer_str = "\n".join(prayer_list) if prayer_list else "No active prayer requests."
                
                # Fetch reports stats
                total_reports_count = reports.count()
                approved_reports_count = reports.filter(status='approved').count()
                reports_stat_str = (
                    f"Reports Stats:\n"
                    f"- Total Reports: {total_reports_count}\n"
                    f"- Approved Reports: {approved_reports_count}\n"
                )
            except Exception as e:
                pass
            
        system_prompt = (
            "You are SU-Connect AI, the assistant for Scripture Union Rwanda. "
            "Answer the user's question in a friendly, concise, and professional manner. "
            "If the user asks for a short summary, limit it to 3-4 sentences. However, if the user asks a question about the project documentation, system architecture, database design, testing, requirements, or asks for detailed solutions, you MUST provide a detailed, comprehensive, high-quality answer containing all necessary details and technical specifications.\n"
            f"The user has the role '{user.role}' in region '{getattr(user, 'region', 'N/A')}'. "
            "Use the provided context to answer questions about their account, deadlines, notifications, support requests, prayer requests, or activities accurately. "
            "Do NOT say 'I do not have access to your personal account or any specific information about your role'. You DO have it in the context! "
            "Reference specific details, names, dates, status, or metrics from the context. "
            "Do NOT print random Bible verses unless explicitly asked. "
            "If the user specifies custom guidelines, instructions, or overrides (the 'law of the user'), you must prioritize and obey those instructions."
        )
        
        user_prompt = (
            f"--- SYSTEM EXTRACTED CONTEXT & DOCUMENTS ---\n{context_str}\n\n"
            f"--- USER PROFILE & SYSTEM STATE ---\n"
            f"{profile_info}\n"
            f"--- NOTIFICATIONS ---\n{notifications_str}\n\n"
            f"--- SUPPORT REQUESTS ---\n{support_str}\n\n"
            f"--- PRAYER REQUESTS ---\n{prayer_str}\n\n"
            f"--- REPORTS STATS ---\n{reports_stat_str}\n"
            f"-------------------------------------------\n\n"
            f"User Question: {user_message}"
        )
        
        if stream:
            def text_stream_generator():
                try:
                    yield json.dumps({"citations": citations}) + "\n"
                    num_ctx = 4096 if (report_ids or document_ids) else 3072
                    payload = {
                        "model": ollama_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": True,
                        "keep_alive": "1h",
                        "options": {
                            "temperature": 0.1,
                            "num_ctx": num_ctx,
                            "num_predict": 500
                        }
                    }
                    response = requests.post(
                        f"{ollama_url.rstrip('/')}/api/chat",
                        json=payload,
                        stream=True,
                        timeout=300
                    )
                    if response.status_code == 200:
                        for line in response.iter_lines():
                            if line:
                                chunk = json.loads(line.decode('utf-8'))
                                content = chunk.get('message', {}).get('content', '')
                                if content:
                                    yield json.dumps({"content": content}) + "\n"
                    else:
                        yield json.dumps({"error": f"Chat Assistant: Ollama returned status {response.status_code}."}) + "\n"
                except requests.exceptions.Timeout:
                    yield json.dumps({"error": "⏱ The AI is still loading. Please wait 30 seconds and try again. The model needs time to load into memory on first use."}) + "\n"
                except requests.exceptions.ConnectionError:
                    yield json.dumps({"error": "⚠ Could not connect to Ollama. Please run: ollama serve"}) + "\n"
                except requests.exceptions.RequestException as e:
                    yield json.dumps({"error": f"⚠ AI assistant error: {e}"}) + "\n"
            return text_stream_generator()

        try:
            num_ctx = 4096 if (report_ids or document_ids) else 3072
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False,
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.1,
                    "num_ctx": num_ctx,
                    "num_predict": 500
                }
            }
            response = requests.post(
                f"{ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=300
            )
            if response.status_code == 200:
                return response.json().get('message', {}).get('content', '').strip(), citations
            else:
                return f"Chat Assistant: Ollama returned status {response.status_code}.", citations
        except requests.exceptions.Timeout:
            return (
                "⏱ The AI is still loading. Please wait 30 seconds and try again. "
                "The model needs time to load into memory on first use."
            ), citations
        except requests.exceptions.ConnectionError:
            return "⚠ Could not connect to Ollama. Please run: ollama serve", citations
        except requests.exceptions.RequestException as e:
            return f"⚠ AI assistant error: {e}", citations

    @staticmethod
    def generate_regional_insights(region=None):
        from apps.reports.models import Report
        from django.db.models import Count
        from django.core.cache import cache
        import requests
        import json
        import threading
        import logging
        from django.conf import settings
        
        logger = logging.getLogger(__name__)

        # Filter reports for this region
        reports_qs = Report.objects.filter(is_deleted=False)
        if region:
            reports_qs = reports_qs.filter(region=region)
            
        reports = list(reports_qs.order_by('-date')[:10])
        
        if not reports:
            return [
                {
                    "title": "Initial Reporting Phase",
                    "type": "info",
                    "text": "No activity reports have been analyzed in this region yet. Submit reports to generate AI insights."
                }
            ]
            
        context_data = []
        for r in reports:
            context_data.append(
                f"- [{r.date}] Title: {r.title} | Type: {r.type} | Participants: {r.participants}\n"
                f"  Summary: {r.ai_summary or r.description[:150]}\n"
                f"  Challenges: {r.challenges or 'None'}"
            )
        reports_str = "\n".join(context_data)
        
        prompt = (
            "Analyze the following regional activity reports and generate exactly 3 highly actionable, "
            "data-driven operational insights, recommendations, or alerts for the regional coordinator. "
            "For each insight, assign a category type ('positive', 'warning', or 'info') and a short, punchy title.\n\n"
            "Reports data:\n"
            f"{reports_str}\n\n"
            "Respond ONLY with a valid JSON list of objects matching this schema:\n"
            "[\n"
            "  {\n"
            "    \"title\": \"string (punchy, action-oriented title)\",\n"
            "    \"type\": \"string (exactly one of: 'positive', 'warning', 'info')\",\n"
            "    \"text\": \"string (1-2 sentence detailed insight or recommendation based on data)\"\n"
            "  }\n"
            "]"
        )
        
        # Helper to compute rule-based fallback insights instantly
        def get_fallback_insights():
            fallback_insights = []
            
            # 1. Total reach check
            total_reach = sum(r.participants for r in reports)
            if total_reach > 1000:
                fallback_insights.append({
                    "title": "Outstanding Ministry Reach",
                    "type": "positive",
                    "text": f"Ministry activities have reached an outstanding total of {total_reach} active participants. Excellent mobilization efforts."
                })
            else:
                fallback_insights.append({
                    "title": "Reach Optimization Potential",
                    "type": "info",
                    "text": f"Current regional reach is {total_reach} participants. Target expanding youth program outreach to nearby schools."
                })
                
            # 2. Resource/challenges check
            resource_shortages = [r for r in reports if r.challenges and ('shortage' in r.challenges.lower() or 'material' in r.challenges.lower() or 'guide' in r.challenges.lower())]
            if resource_shortages:
                fallback_insights.append({
                    "title": "Resource Allocation Alert",
                    "type": "warning",
                    "text": f"Challenges regarding material and Bible study guide shortages were reported in '{resource_shortages[0].title}'. Consider reallocating resources."
                })
            else:
                fallback_insights.append({
                    "title": "Logistical Workflow Stable",
                    "type": "positive",
                    "text": "No critical resource bottlenecks or logistics constraints have been flagged in recent reports."
                })
                
            # 3. Frequency check
            from django.utils import timezone
            from datetime import timedelta
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            recent_count = sum(1 for r in reports if r.date >= thirty_days_ago)
            if recent_count < 3:
                fallback_insights.append({
                    "title": "Reporting Frequency Warning",
                    "type": "warning",
                    "text": f"Only {recent_count} activity reports have been submitted in the last 30 days. Recommend reminding field officers about submission deadlines."
                })
            else:
                fallback_insights.append({
                    "title": "Consistent Reporting Cadence",
                    "type": "info",
                    "text": f"Officers have maintained a regular schedule with {recent_count} submissions over the last 30 days."
                })
                
            return fallback_insights[:3]

        # Local Ollama Helper
        def run_ollama_insights():
            ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
            ollama_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
            
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": "You are SU-Connect AI, the assistant for Scripture Union Rwanda. You extract structured insights from activity reports."},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json",
                "keep_alive": "1h",
                "options": {
                    "temperature": 0.3,
                    "num_ctx": 4096,
                    "num_predict": 500
                }
            }
            response = requests.post(
                f"{ollama_url.rstrip('/')}/api/chat",
                json=payload,
                timeout=45
            )
            if response.status_code == 200:
                content = response.json().get('message', {}).get('content', '').strip()
                return json.loads(content)
            raise Exception(f"Ollama status {response.status_code}")

        # Async background worker to hit Ollama and update cache
        def async_fetch_and_cache(cache_key, fallback):
            try:
                ai_data = run_ollama_insights()
                cache.set(cache_key, ai_data, 3600)  # Cache for 1 hour
            except Exception as e:
                logger.error(f"Background Ollama insights generation failed: {e}")
                # Cache fallback data temporarily (e.g. 5 minutes) to avoid spawning multiple threads repeatedly
                cache.set(cache_key, fallback, 300)

        # Main caching logic
        cache_key = f"regional_insights_{region or 'all'}"
        cached_insights = None
        try:
            cached_insights = cache.get(cache_key)
        except Exception as e:
            logger.error(f"Cache connection error: {e}")

        if cached_insights:
            return cached_insights

        # If not cached, compute fallback instantly
        fallback_data = get_fallback_insights()

        # Spin off background thread to fetch Ollama insights asynchronously
        threading.Thread(
            target=async_fetch_and_cache,
            args=(cache_key, fallback_data),
            daemon=True
        ).start()

        # Return fallback data instantly
        return fallback_data
