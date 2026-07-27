import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, X, Sparkles, Bot, Paperclip, FileText, Download } from 'lucide-react';
import { reportService, documentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './SUConnectAI.css';

export default function SUConnectAI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'ai',
      text: `Hello! I am **SU-Connect AI**, your local Scripture Union Rwanda assistant. I can query regional reports and support tickets to answer your questions. 

How can I help you today?`
    }
  ]);
  const [sending, setSending] = useState(false);
  const [chatFile, setChatFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState({ checked: false, running: false, modelAvailable: false, configuredModel: 'qwen2.5vl:3b' });
  const [selectedModel, setSelectedModel] = useState('qwen2.5vl:3b');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Check Ollama health when panel is opened
  useEffect(() => {
    if (open && !ollamaStatus.checked) {
      reportService.aiStatus().then(data => {
        setOllamaStatus({ checked: true, running: data.running, modelAvailable: data.modelAvailable, configuredModel: data.configuredModel || 'qwen2.5vl:3b' });
      }).catch(() => {
        setOllamaStatus({ checked: true, running: false, modelAvailable: false, configuredModel: 'qwen2.5vl:3b' });
      });
    }
  }, [open]);

  if (!user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setChatFile(file);
    }
  };

  const removeSelectedFile = () => {
    setChatFile(null);
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !chatFile) || sending || uploadingFile) return;

    const userMsg = input.trim() || `Analyze the attached file: ${chatFile ? chatFile.name : ''}`;
    setInput('');
    const newMsgId = Date.now().toString();

    const textToShow = userMsg;
    setMessages(prev => [...prev, { id: newMsgId, sender: 'user', text: textToShow }]);
    setSending(true);

    let documentIds = [];
    const fileToUpload = chatFile;
    const isImageFile = fileToUpload && /\.(jpg|jpeg|png)$/i.test(fileToUpload.name);
    setChatFile(null); // Clear selected file preview
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) fileInput.value = '';

    if (isImageFile && selectedModel === 'mistral:7b-instruct-q4_K_M') {
      const aiMsgId = Date.now().toString() + "-ai";
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: aiMsgId,
          sender: 'ai',
          text: '⚠️ I noticed you attached an image but are trying to use the **Mistral (7B)** text-only model. Mistral does not support image analysis. Please select the **Qwen-2.5-VL (Fast 3B)** vision model from the dropdown above to analyze photos or visual things!'
        }]);
        setSending(false);
      }, 600);
      return;
    }

    const aiMsgId = Date.now().toString() + "-ai";

    try {
      if (fileToUpload) {
        setUploadingFile(true);
        if (isImageFile) setSendingImage(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        try {
          const uploadedDoc = await documentService.upload(formData);
          documentIds = [uploadedDoc.id];
          setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, document: uploadedDoc } : m));
        } catch (uploadErr) {
          const status = uploadErr?.response?.status;
          const errMsg = uploadErr?.response?.data?.error;
          if (status === 401) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: '⚠️ Your session has expired. Please refresh the page and log in again.' }]);
          } else if (status === 400) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: `⚠️ Could not upload file: ${errMsg || 'Invalid or unsupported file type. Allowed: PDF, DOCX, XLSX, JPG, JPEG, PNG, TXT, CSV'}` }]);
          } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: `⚠️ File upload failed: ${errMsg || 'Please try again.'}` }]);
          }
          setSending(false);
          setUploadingFile(false);
          return; // Stop — don't send message if upload failed
        }
      }

      // Add empty AI message bubble for streaming
      setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '' }]);

      let fullText = '';
      await reportService.chatStream(
        userMsg,
        documentIds,
        [],
        selectedModel,
        (chunk, citations) => {
          if (citations) {
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, citations } : m));
          }
          if (chunk) {
            fullText += chunk;
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
          }
        },
        (error) => {
          let errMsg = error.message || 'Unknown error';
          if (errMsg.includes('Ollama offline') || errMsg.includes('Could not connect') || errMsg.includes('Failed to fetch')) {
            errMsg = '⚠️ Could not connect to the local Ollama server. Please ensure Ollama is running with `ollama serve` and the model is downloaded.';
          }
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `⚠️ AI assistant error: ${errMsg}` } : m));
        }
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: '⚠️ Your session has expired. Please refresh the page and log in again.' }]);
      } else {
        const errDetail = err?.response?.data?.error || err?.message || 'Unknown error';
        setMessages(prev => {
          if (prev.some(m => m.id === aiMsgId)) {
            return prev.map(m => m.id === aiMsgId ? { ...m, text: `⚠️ AI assistant error: ${errDetail}` } : m);
          }
          return [...prev, { id: Date.now().toString(), sender: 'ai', text: `⚠️ AI assistant error: ${errDetail}` }];
        });
      }
    } finally {
      setSending(false);
      setUploadingFile(false);
      setSendingImage(false);
    }
  };

  const renderMessageText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const renderedElements = [];
    let currentUlList = [];
    let currentOlList = [];
    let insideUl = false;
    let insideOl = false;

    const flushLists = (key) => {
      if (insideUl && currentUlList.length > 0) {
        renderedElements.push(
          <ul key={`ul-${key}`} style={{ paddingLeft: '18px', margin: '4px 0 10px 0', listStyleType: 'disc' }}>
            {currentUlList}
          </ul>
        );
        currentUlList = [];
        insideUl = false;
      }
      if (insideOl && currentOlList.length > 0) {
        renderedElements.push(
          <ol key={`ol-${key}`} style={{ paddingLeft: '18px', margin: '4px 0 10px 0', listStyleType: 'decimal' }}>
            {currentOlList}
          </ol>
        );
        currentOlList = [];
        insideOl = false;
      }
    };

    const formatBold = (str) => {
      return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed === '') {
        flushLists(index);
        return;
      }

      // Check for headings
      const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
      if (headingMatch) {
        flushLists(index);
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const htmlContent = formatBold(headingText);

        if (level <= 2) {
          renderedElements.push(
            <h3 key={index} style={{ 
              color: 'var(--primary, #2e7d32)', 
              fontSize: '1.05rem', 
              fontWeight: 800, 
              borderBottom: '1px solid var(--border-light, #e2ebe2)', 
              paddingBottom: '4px', 
              margin: '12px 0 6px 0' 
            }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          );
        } else if (level === 3) {
          renderedElements.push(
            <h4 key={index} style={{ 
              color: 'var(--primary, #2e7d32)', 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              margin: '10px 0 4px 0' 
            }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          );
        } else {
          renderedElements.push(
            <h5 key={index} style={{ 
              color: 'var(--text-primary, #1b2e1c)', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              margin: '8px 0 2px 0'
            }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          );
        }
        return;
      }

      // Check for unordered list item
      const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
      if (ulMatch) {
        if (insideOl) flushLists(index);
        insideUl = true;
        const bulletText = ulMatch[1];
        const htmlContent = formatBold(bulletText);
        currentUlList.push(
          <li 
            key={index} 
            style={{ fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '3px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        );
        return;
      }

      // Check for ordered list item
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (insideUl) flushLists(index);
        insideOl = true;
        const numberText = olMatch[2];
        const htmlContent = formatBold(numberText);
        currentOlList.push(
          <li 
            key={index} 
            style={{ fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '3px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        );
        return;
      }

      // Default to paragraph
      flushLists(index);
      const htmlContent = formatBold(trimmed);
      renderedElements.push(
        <p 
          key={index} 
          style={{ fontSize: '0.85rem', lineHeight: '1.4', margin: '0 0 6px 0' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      );
    });

    flushLists('final');
    return <div className="su-ai-message-text">{renderedElements}</div>;
  };

  return (
    <div className="su-ai-widget">
      {open ? (
        <div className="su-ai-panel">
          <div className="su-ai-header">
            <div className="su-ai-header-info">
              <Sparkles size={18} />
              <div>
                <h3 className="su-ai-header-title">SU-Connect AI</h3>
                <div className="su-ai-status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className={`su-ai-status-dot ${ollamaStatus.checked ? (ollamaStatus.running && ollamaStatus.modelAvailable ? 'status-ok' : ollamaStatus.running ? 'status-warn' : 'status-error') : ''}`} />
                  <span>
                    {!ollamaStatus.checked ? 'Checking...' :
                     !ollamaStatus.running ? '✗ Ollama offline' :
                     !ollamaStatus.modelAvailable ? '⚠️ Model not found' : ''}
                  </span>
                  {ollamaStatus.running && ollamaStatus.modelAvailable && (
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        padding: '1px 16px 1px 4px',
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    >
                      <option value="qwen2.5vl:3b" style={{ color: '#000' }}>Qwen-2.5-VL (Fast 3B)</option>
                      <option value="mistral:7b-instruct-q4_K_M" style={{ color: '#000' }}>Mistral (7B)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
            <button className="su-ai-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="su-ai-messages" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`su-ai-message ${m.sender}`}>
                {renderMessageText(m.text)}
                {m.sender === 'ai' && m.citations && m.citations.length > 0 && (
                  <div className="su-ai-citations">
                    <div className="su-ai-citations-title">
                      <FileText size={10} /> Cited Reports
                    </div>
                    {m.citations.map((c) => (
                      <button
                        key={c.id}
                        className="su-ai-citation-item"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/reports/${c.id}`);
                        }}
                        type="button"
                      >
                        <div className="su-ai-citation-info">
                          <span className="su-ai-citation-title-text">{c.title}</span>
                          <span className="su-ai-citation-meta">
                            <span>{c.date}</span>
                            <span>•</span>
                            <span>{c.region}</span>
                          </span>
                        </div>
                        <span className="su-ai-citation-badge">{c.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                {m.document && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: m.sender === 'user' ? 'rgba(255,255,255,0.15)' : 'var(--bg-input)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6, border: m.sender === 'user' ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {['jpg', 'jpeg', 'png'].includes(m.document.type?.toLowerCase()) ? '🖼️' : '📄'}
                      </span>
                      <span className="truncate" style={{ flex: 1, fontWeight: 500 }}>{m.document.name}</span>
                    </div>
                    {['jpg', 'jpeg', 'png'].includes(m.document.type?.toLowerCase()) && (
                      <img src={`http://localhost:8000/api/documents/${m.document.id}/download`} alt={m.document.name} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4, marginTop: 4 }} />
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <a href={`http://localhost:8000/api/documents/${m.document.id}/download`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', textDecoration: 'none', color: m.sender === 'user' ? '#fff' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <FileText size={12} /> View
                      </a>
                      <a href={`http://localhost:8000/api/documents/${m.document.id}/download?download=1`} download={m.document.name} style={{ fontSize: '0.75rem', textDecoration: 'none', color: m.sender === 'user' ? '#fff' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sending && (uploadingFile || sendingImage || !messages[messages.length - 1]?.text) && (
              <div className="su-ai-loading">
                <div className="su-ai-loading-dot" />
                <div className="su-ai-loading-dot" />
                <div className="su-ai-loading-dot" />
                <span className="su-ai-loading-label">
                  {uploadingFile ? 'Uploading...' : (sendingImage ? 'Analyzing image… this may take a minute' : 'Thinking…')}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Suggested Questions Chips based on user role and region */}
          <div className="su-ai-suggestions">
            {((user?.role === 'regional_coordinator') ? [
              `Summarize the major challenges reported by field officers in ${user.region} this month`,
              `Which field officer reached the most participants in ${user.region}?`,
              `Draft a weekly summary email for the National Manager based on approved reports in ${user.region}`,
              `Identify any resource or material shortages in ${user.region}`
            ] : (user?.role === 'field_officer') ? [
              `Summarize my activities in ${user.region} this month`,
              `What are the next deadlines for my reports?`,
              `Draft a report overview for the Regional Coordinator`,
              `Check if my report demographics are correct`
            ] : (user?.role === 'national_manager') ? [
              "Compare the youth outreach effectiveness in Eastern Province vs. Western Province this quarter",
              "Summarize the national Bible Study resource issues and list which regions are hit hardest",
              "Generate a draft for Scripture Union Rwanda's National Monthly Executive Brief",
              "Which region shows the highest risk of reporting fatigue or missed targets?"
            ] : [
              "How many youth were reached nationwide this month?",
              "Summarize outreach activities across all regions",
              "Identify regions showing underreporting trends",
              "Which department has the highest participation?"
            ]).map((sug, idx) => (
              <button 
                key={idx}
                type="button"
                className="su-ai-chip"
                onClick={() => setInput(sug)}
              >
                {sug}
              </button>
            ))}
          </div>

          {chatFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>
                {chatFile.name.endsWith('.pdf') ? '📄' : ['.jpg', '.jpeg', '.png'].some(ext => chatFile.name.toLowerCase().endsWith(ext)) ? '🖼️' : '📄'}
              </span>
              <span className="truncate" style={{ flex: 1, fontWeight: 500 }}>{chatFile.name}</span>
              <button type="button" onClick={removeSelectedFile} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {ollamaStatus.checked && !ollamaStatus.running && (
            <div className="su-ai-offline-banner">
              ⚠ Ollama is offline. Run <code style={{ background: 'rgba(0,0,0,0.07)', padding: '1px 5px', borderRadius: 3, fontSize: '0.7rem' }}>ollama serve</code> in a terminal to start it.
            </div>
          )}

          <form className="su-ai-input-form" onSubmit={handleSend}>
            <input type="file" id="chat-file-input" style={{ display: 'none' }} accept=".pdf,.docx,.xlsx,.zip,.jpg,.jpeg,.png,.txt,.csv" onChange={handleFileChange} />
            <button 
              type="button" 
              className="su-ai-attach-btn" 
              onClick={() => document.getElementById('chat-file-input').click()} 
              disabled={sending || uploadingFile}
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              placeholder={uploadingFile ? "Uploading file..." : "Ask about reports, activities..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || uploadingFile}
            />
            <button className="su-ai-submit" type="submit" disabled={(!input.trim() && !chatFile) || sending || uploadingFile}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button className="su-ai-trigger" onClick={() => setOpen(true)}>
          <Bot size={24} />
        </button>
      )}
    </div>
  );
}
