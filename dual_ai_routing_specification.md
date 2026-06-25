# SU Connect — Dual AI Routing Specification (Mistral-7B & Qwen-2.5-VL)

This specification details the architecture, routing logic, and system prompt alignment required to transition Scripture Union Rwanda's backend from a single-model setup to a **Dual-Model Dynamic AI Engine** powered by local Ollama instances.

The goal is to optimize both execution speed and cognitive accuracy by routing purely text-based tasks to a high-capacity instruction-following model (`mistral:7b-instruct-q4_K_M`) and visual/multimodal tasks to a specialized vision model (`qwen2.5vl:3b`). This routing happens silently on the backend, making the multi-model architecture completely transparent to the frontend and end-users.

---

## 1. Architectural Overview & Division of Labor

To ensure maximum speed, high accuracy, and strict JSON formatting, the system splits AI operations based on input modalities:

```mermaid
graph TD
    subgraph Client Application (Frontend)
        UI[User Chat / Admin Dashboard / Report Form] -->|API Request| Router[Django API Endpoints]
    end

    subgraph Backend Routing Logic (Django)
        Router -->|Checks for File Attachments| Inspector{Has Images?}
        Inspector -->|Yes: Image Attached| VisionEngine[Vision Engine: qwen2.5vl:3b]
        Inspector -->|No: Text Only| TextEngine[Text Engine: mistral:7b-instruct-q4_K_M]
    end

    subgraph Ollama Service Layer
        VisionEngine -->|API Call /api/chat| Ollama[(Ollama Local Server)]
        TextEngine -->|API Call /api/chat| Ollama
    end

    subgraph Unified Persona: SU-Connect AI
        Ollama -->|Consistent Persona & Formatting| UI
    end
```

### Model Matrix

| Tasks / Operations | Routed Model | Key Rationale |
| :--- | :--- | :--- |
| **Weekly Report Categorization** | `mistral:7b-instruct-q4_K_M` | Requires strict structured JSON output and deep reading comprehension of activity descriptions. |
| **Trend & Anomaly Detection** | `mistral:7b-instruct-q4_K_M` | Analyzes large batches of textual data; needs a 7B parameter reasoning model to detect semantic duplicate entries. |
| **RAG Chat (Text-Only)** | `mistral:7b-instruct-q4_K_M` | RAG context processing and prompt following are vastly superior in Mistral-7B. |
| **Support Request Priority Assignment**| `mistral:7b-instruct-q4_K_M` | Requires classification following strict administrative priority rules. |
| **RAG Chat (With Images/Photos)** | `qwen2.5vl:3b` | Specifically trained for visual-language tasks (OCR, layout analysis, describing images of ministry events). |

---

## 2. Configuration Settings

We will update [base.py](file:///d:/FINAL-Project/SU-Backend/su_connect/settings/base.py) to declare both models separately.

```python
# su_connect/settings/base.py

# Ollama local settings for Dual AI Engine
OLLAMA_URL = env('OLLAMA_URL', default='http://127.0.0.1:11434')
OLLAMA_TEXT_MODEL = env('OLLAMA_TEXT_MODEL', default='mistral:7b-instruct-q4_K_M')
OLLAMA_VISION_MODEL = env('OLLAMA_VISION_MODEL', default='qwen2.5vl:3b')
```

---

## 3. Dynamic Backend Routing Logic

The routing engine inspects the payload properties to determine which model to call. Below is the technical breakdown of how this is implemented inside [ai_service.py](file:///d:/FINAL-Project/SU-Backend/services/ai_service.py).

### 3.1 Report AI Analysis (Text-Only Categorization)
When analyzing newly submitted reports, the system reads only text data.
* **Model Used:** `settings.OLLAMA_TEXT_MODEL` (`mistral`)
* **Request Payload Options:**
  ```json
  {
    "model": "mistral:7b-instruct-q4_K_M",
    "messages": [...],
    "stream": false,
    "format": "json",
    "options": {
      "temperature": 0.1,
      "num_ctx": 4096,
      "num_predict": 300,
      "keep_alive": "1h"
    }
  }
  ```

### 3.2 Trend & Sentiment Detection
When scanning the past 30 days of reports to identify patterns.
* **Model Used:** `settings.OLLAMA_TEXT_MODEL` (`mistral`)
* **Request Payload Options:**
  ```json
  {
    "model": "mistral:7b-instruct-q4_K_M",
    "messages": [...],
    "stream": false,
    "options": {
      "temperature": 0.3,
      "num_ctx": 8192,
      "num_predict": 1000,
      "keep_alive": "1h"
    }
  }
  ```

### 3.3 RAG Chat Assistant (Hybrid Routing)
Inside the `chat_assistant()` function, the model is selected dynamically based on whether the user attached image documents.
```python
# services/ai_service.py (Routing Logic inside chat_assistant)

ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
if images_list:
    # Route to Qwen-2.5-VL for vision tasks
    selected_model = getattr(settings, 'OLLAMA_VISION_MODEL', 'qwen2.5vl:3b')
    num_ctx = 2048  # Vision tokens are processed internally
    num_predict = 400
else:
    # Route to Mistral-7B for pure text reasoning & RAG
    selected_model = getattr(settings, 'OLLAMA_TEXT_MODEL', 'mistral:7b-instruct-q4_K_M')
    num_ctx = 4096  # Larger context to hold relevant database reports
    num_predict = 600

payload = {
    "model": selected_model,
    "messages": messages,
    "stream": False,
    "options": {
        "temperature": 0.2 if not images_list else 0.3,
        "num_ctx": num_ctx,
        "num_predict": num_predict,
        "keep_alive": "1h" # Keeps both models warm in memory for instant subsequent answers
    }
}
```

---

## 4. Prompt & Persona Alignment (The "Unified AI" Principle)

To ensure the user experiences a seamless interaction without noticing model swaps, both models are instructed to adopt the exact same persona: **SU-Connect AI**, an assistant tailored for Scripture Union Rwanda.

### System Prompt Declarations

We define the prompt system templates identically across services.

#### 1. System Prompt for RAG & Chat (Used by both Mistral and Qwen):
> **System Instruction:**
> "You are SU-Connect AI, the intelligent virtual assistant for Scripture Union Rwanda. Your primary objective is to assist Scripture Union staff (administrators, national managers, regional coordinators, and field officers) by answering questions, synthesizing activity reports, analyzing files, and providing operational guidance.
> 
> **Guidelines:**
> - **Tone:** Maintain a professional, encouraging, spiritually supportive, and clear tone. Always align with the Christian ministry mission of Scripture Union.
> - **Language:** Respond in the language used by the user (English, French, or Kinyarwanda).
> - **Formatting:** Use clean Markdown headers, bullet points, and bold text for readability.
> - **Factuality:** Strictly base your answers on the provided context, reports, or attached documents. Do not hallucinate or manufacture names, statistics, or metrics. If you do not know the answer, state that clearly."

#### 2. Visual Prompt Wrapper (Specifically for Qwen-2.5-VL when handling images):
When images are attached, Qwen is given additional visual instructions while maintaining the same identity:
> **Visual Instruction:**
> "The user has attached an image of a ministry event, document scan, or field activity. Describe what you see in the image and connect it directly to the user's question. Focus on identifying participants, the nature of the activity (e.g., outreach, Bible study, youth fellowship), and any visual text or documentation. Maintain the SU-Connect AI persona."

---

## 5. Performance Tuning & RAM Memory Management

Since running two models locally could potentially cause memory overhead or latency during swaps, we implement three critical optimization settings:

1. **`keep_alive: "1h"` (Warm Cache):**
   Setting `"keep_alive": "1h"` ensures that once Mistral or Qwen is loaded into RAM/VRAM, it is kept warm for 1 hour. This avoids the 15-second loading delay on subsequent questions.
2. **Auto-Thread Selection:**
   Instead of forcing `min(4, max(1, cpu_count // 2))` which restricts CPU allocation, we omit `num_thread` or set it to the physical core count of the host machine. This allows Ollama to utilize all available physical cores, speeding up processing by **30% to 50%** on CPU fallback.
3. **Optimized Context Windows:**
   - Text tasks use `num_ctx: 4096` or `8192` to process larger RAG lists.
   - Vision tasks use `num_ctx: 2048` to avoid RAM spikes, since vision tokens are processed separately.

---

## 6. Implementation Checklist

To roll out the dual-model configuration:

- [ ] **Step 1:** Modify settings file ([base.py](file:///d:/FINAL-Project/SU-Backend/su_connect/settings/base.py)) to define `OLLAMA_TEXT_MODEL` and `OLLAMA_VISION_MODEL`.
- [ ] **Step 2:** Update [ai_service.py](file:///d:/FINAL-Project/SU-Backend/services/ai_service.py):
  - Update `run_ollama_analysis()` to use `settings.OLLAMA_TEXT_MODEL`.
  - Update `run_ollama_trends()` to use `settings.OLLAMA_TEXT_MODEL`.
  - Update `run_ollama_summary()` to use `settings.OLLAMA_TEXT_MODEL`.
  - Update `chat_assistant()` to dynamically route based on `images_list`.
- [ ] **Step 3:** Update [ai_priority_service.py](file:///d:/FINAL-Project/SU-Backend/services/ai_priority_service.py) to route support priority classification to `settings.OLLAMA_TEXT_MODEL`.
- [ ] **Step 4:** Run full verification test suite to ensure endpoints return responses cleanly without error.
