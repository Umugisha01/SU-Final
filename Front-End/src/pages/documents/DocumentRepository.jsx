import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FolderOpen, Search, Upload, Download, Eye, Tag, Grid, List, 
  Share2, X, Edit2, Trash2, Calendar, FileText, Lock, Globe 
} from 'lucide-react';
import { documentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { REGIONS } from '../../data/mockData';

const TYPE_COLORS = { 
  PDF: '#ef4444', 
  DOCX: '#1565c0', DOC: '#1565c0',
  XLSX: '#166534', XLS: '#166534',
  ZIP: '#6a1b9a', RAR: '#6a1b9a', 
  JPG: '#f9a825', JPEG: '#f9a825', PNG: '#f9a825' 
};

const TYPE_ICONS = { 
  PDF: '📄', 
  DOCX: '📝', DOC: '📝', 
  XLSX: '📊', XLS: '📊', 
  ZIP: '🗜️', RAR: '🗜️', 
  JPG: '🖼️', JPEG: '🖼️', PNG: '🖼️' 
};

const FOLDERS = [
  { name: 'All Documents', desc: 'Centralized archive of all Scripture Union Rwanda documents.' },
  { name: 'Activity Reports', desc: 'Store all raw activity reports (one sub-folder per activity type).' },
  { name: 'Consolidated Reports', desc: 'Keep weekly/monthly/quarterly PDF/Word summaries.' },
  { name: 'Planning Documents', desc: 'Budgets, event plans, volunteer schedules.' },
  { name: 'Policies & Guidelines', desc: 'SU Rwanda internal policies, reporting guidelines.' },
  { name: 'Activity Photos', desc: 'Photos from events, sorted by date/region.' },
  { name: 'Training Materials', desc: 'Manuals, slides, facilitator guides.' },
  { name: 'Prayer Documents', desc: 'Prayer requests, answered prayer logs.' },
  { name: 'Schedules', desc: 'Calendars, shift rosters, camp timetables.' },
  { name: 'Support Requests', desc: 'Material/transport/finance requests with status tracking.' },
  { name: 'Others', desc: 'All other materials that cannot be related to the categories above.' }
];

export default function DocumentRepository() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('All Documents');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [search, setSearch] = useState(initialQuery);
  const [view, setView] = useState('grid');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(null);

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Others');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadShared, setUploadShared] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Others');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editShared, setEditShared] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        region: filterRegion,
        type: filterType,
        start_date: startDate,
        end_date: endDate,
        limit: 200, // Fetch a large batch to allow local folder categorization
      };
      const res = await documentService.list(params);
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, filterRegion, filterType, startDate, endDate]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setSearchParams(val ? { q: val } : {});
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTagsArray = (tagsStr) => {
    if (!tagsStr) return [];
    return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  };

  const getAbsoluteUrl = (urlStr, docId) => {
    if (!urlStr) return `http://localhost:8000/api/documents/${docId}/download`;
    if (urlStr.startsWith('/')) return `http://localhost:8000${urlStr}`;
    return urlStr;
  };

  // Filter documents by active folder on the frontend
  const filtered = documents.filter(d => {
    if (activeFolder !== 'All Documents' && d.category !== activeFolder) return false;
    return true;
  });

  const getFolderCount = (folderName) => {
    if (folderName === 'All Documents') return documents.length;
    return documents.filter(d => d.category === folderName).length;
  };

  const handleDownloadFile = (docId) => {
    window.open(`http://localhost:8000/api/documents/${docId}/download?download=1`, '_blank');
    setTimeout(fetchDocuments, 1000); // refresh list to show updated download count
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', uploadCategory);
    formData.append('description', uploadDesc);
    formData.append('tags', uploadTags);
    formData.append('shared', uploadShared);

    try {
      const res = await documentService.upload(formData);
      if (res.id) {
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadDesc('');
        setUploadTags('');
        setUploadShared(false);
        fetchDocuments();
      } else {
        setUploadError(res.error || "Failed to upload document.");
      }
    } catch (err) {
      setUploadError(err.response?.data?.error || "Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (doc) => {
    setSelected(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditDesc(doc.description || '');
    setEditTags(doc.tags || '');
    setEditShared(doc.shared || false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setEditError('');
    try {
      const res = await documentService.update(selected.id, {
        name: editName,
        category: editCategory,
        description: editDesc,
        tags: editTags,
        shared: editShared
      });
      if (res.id) {
        setIsEditOpen(false);
        setSelected(null);
        fetchDocuments();
      } else {
        setEditError(res.error || "Failed to update document.");
      }
    } catch (err) {
      setEditError(err.response?.data?.error || "Error updating document.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document permanently?")) return;
    try {
      const res = await documentService.delete(docId);
      if (res.success) {
        setSelected(null);
        fetchDocuments();
      } else {
        alert(res.error || "Failed to delete document.");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting document.");
    }
  };

  const canModify = (doc) => {
    if (!user || !doc) return false;
    return (
      doc.uploaded_by?.id === user.id ||
      user.role === 'administrator' ||
      user.role === 'national_manager'
    );
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderOpen size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />
            Document Repository
          </h1>
          <p className="page-subtitle">{documents.length} documents stored · Scripture Union Archive</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => { setUploadCategory(activeFolder === 'All Documents' ? 'Others' : activeFolder); setIsUploadOpen(true); }}>
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar Folders */}
        <div style={{ width: 250, flexShrink: 0 }}>
          <div className="card" style={{ padding: '12px 0' }}>
            <p style={{ padding: '8px 16px 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Folders</p>
            {FOLDERS.map(f => (
              <button key={f.name} onClick={() => setActiveFolder(f.name)}
                style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: activeFolder === f.name ? 'var(--primary-50)' : 'transparent', color: activeFolder === f.name ? 'var(--primary)' : 'var(--text-primary)', fontWeight: activeFolder === f.name ? 600 : 400, fontSize: '0.85rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'all var(--transition)', borderLeft: activeFolder === f.name ? '3px solid var(--primary)' : '3px solid transparent' }}>
                <FolderOpen size={14} style={{ opacity: activeFolder === f.name ? 1 : 0.6 }} />
                <span className="truncate" style={{ flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: activeFolder === f.name ? 'rgba(46,125,50,0.1)' : 'var(--bg-input)', padding: '2px 6px', borderRadius: '8px' }}>
                  {getFolderCount(f.name)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Folder Info & Description */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-hover)', borderColor: 'var(--primary-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>{activeFolder}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                {FOLDERS.find(f => f.name === activeFolder)?.desc}
              </p>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              {filtered.length} files
            </span>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <div className="search-wrapper" style={{ flex: 1, minWidth: 240 }}>
                <Search size={16} className="search-icon" />
                <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Global Search (by name, description, tags, uploader)..." value={search} onChange={e => handleSearchChange(e.target.value)} />
              </div>
              <select className="form-control form-select" style={{ width: 160 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                <option value="all">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select className="form-control form-select" style={{ width: 120 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                {['PDF', 'DOCX', 'XLSX', 'ZIP', 'JPG', 'PNG'].map(t => <option key={t} value={t}>.{t}</option>)}
              </select>
              <div className="tabs" style={{ width: 'auto' }}>
                {['grid', 'list'].map(v => (
                  <button key={v} className={`tab ${view === v ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 12px' }} onClick={() => setView(v)}>
                    {v === 'grid' ? <Grid size={14} /> : <List size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filters Row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date range:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" className="form-control" style={{ width: 145, padding: '4px 8px', fontSize: '0.8rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
                <input type="date" className="form-control" style={{ width: 145, padding: '4px 8px', fontSize: '0.8rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              {(startDate || endDate) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={12} /> Clear Date
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-state card" style={{ padding: '60px' }}>
              <div style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>Loading files from server...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state card" style={{ padding: '60px' }}>
              <FolderOpen size={40} className="empty-state-icon" />
              <h3>No Documents Found</h3>
              <p>No files match the filters or search query in this category.</p>
            </div>
          ) : view === 'grid' ? (
            /* Grid View */
            <div className="grid grid-3">
              {filtered.map(d => (
                <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all var(--transition)', cursor: 'pointer' }} onClick={() => setSelected(d)}>
                  <div style={{ padding: '24px 20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: '1px solid var(--border-light)', relative: 'true' }}>
                    <div style={{ fontSize: '3.2rem', marginBottom: 4 }}>{TYPE_ICONS[d.type] || '📄'}</div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: TYPE_COLORS[d.type] || '#6b7280', letterSpacing: '0.05em' }}>.{d.type}</span>
                    {d.shared && (
                      <span title="Shared globally" style={{ position: 'absolute', top: 12, right: 12, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                        <Globe size={12} />
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }} className="truncate" title={d.name}>{d.name}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }} className="truncate">{d.description || 'No description provided.'}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Size: {formatSize(d.size)} · By: {d.uploaded_by?.name || 'Unknown'}</p>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {getTagsArray(d.tags).slice(0, 3).map(t => (
                          <span key={t} className="badge badge-primary" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>{t}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{d.created_at ? d.created_at.split('T')[0] : ''}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); window.open(getAbsoluteUrl(d.url, d.id), '_blank'); }} title="View Document"><Eye size={13} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDownloadFile(d.id); }} title="Download"><Download size={13} /></button>
                          {canModify(d) && (
                            <>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenEdit(d); }} title="Edit Document"><Edit2 size={13} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} title="Delete Document"><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Folder</th>
                      <th>Region</th>
                      <th>Size</th>
                      <th>Uploaded By</th>
                      <th>Upload Date</th>
                      <th>Downloads</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.4rem' }}>{TYPE_ICONS[d.type] || '📄'}</span>
                            <div style={{ maxWidth: 220 }}>
                              <p style={{ fontWeight: 600, fontSize: '0.85rem' }} className="truncate" title={d.name}>{d.name}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="truncate">{d.description || 'No description.'}</p>
                              <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                {getTagsArray(d.tags).slice(0, 2).map(t => (
                                  <span key={t} className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>{d.category}</td>
                        <td style={{ fontSize: '0.78rem' }}>{d.uploaded_by?.region || 'All Regions'}</td>
                        <td style={{ fontSize: '0.78rem' }}>{formatSize(d.size)}</td>
                        <td style={{ fontSize: '0.78rem' }}>{d.uploaded_by?.name || 'Unknown'}</td>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.created_at ? d.created_at.split('T')[0] : ''}</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.downloads}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); window.open(getAbsoluteUrl(d.url, d.id), '_blank'); }} title="View Document"><Eye size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDownloadFile(d.id); }} title="Download"><Download size={13} /></button>
                            {canModify(d) && (
                              <>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenEdit(d); }} title="Edit"><Edit2 size={13} /></button>
                                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} title="Delete"><Trash2 size={13} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      {selected && !isEditOpen && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="truncate" style={{ maxWidth: '85%' }}>{selected.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
                <div style={{ fontSize: '4.5rem', marginBottom: 6 }}>{TYPE_ICONS[selected.type] || '📄'}</div>
                <p style={{ fontSize: '0.78rem', fontWeight: 800, color: TYPE_COLORS[selected.type], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.type} File</p>
              </div>

              {[
                { label: 'Description', val: selected.description || 'No description provided.' },
                { label: 'Folder / Category', val: selected.category },
                { label: 'Region of Upload', val: selected.uploaded_by?.region || 'All Regions' },
                { label: 'File Size', val: formatSize(selected.size) },
                { label: 'Uploaded By', val: `${selected.uploaded_by?.name || 'Unknown'} (${selected.uploaded_by?.email || 'N/A'})` },
                { label: 'Upload Date', val: selected.created_at ? selected.created_at.split('T')[0] : '' },
                { label: 'Total Downloads', val: selected.downloads },
                { label: 'Shared Vault Document', val: selected.shared ? 'Yes (Visible system-wide)' : 'No (Region-isolated)' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Tags</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {getTagsArray(selected.tags).length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', italic: 'true' }}>No tags defined.</span>
                  ) : (
                    getTagsArray(selected.tags).map(t => <span key={t} className="badge badge-primary">{t}</span>)
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {canModify(selected) && (
                <>
                  <button className="btn btn-secondary" onClick={() => handleOpenEdit(selected)} style={{ marginRight: 'auto' }}>
                    <Edit2 size={14} /> Edit Metadata
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => window.open(getAbsoluteUrl(selected.url, selected.id), '_blank')}>
                <Eye size={14} /> View Document
              </button>
              <button className="btn btn-primary" onClick={() => handleDownloadFile(selected.id)}>
                <Download size={14} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Upload Document</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsUploadOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {uploadError && <div className="alert alert-danger">{uploadError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Select File <span>*</span></label>
                  <input type="file" className="form-control" required onChange={e => setUploadFile(e.target.files[0])} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max file size: 10MB. Allowed extensions: PDF, DOCX, XLSX, ZIP, JPG, PNG.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Folder / Category <span>*</span></label>
                  <select className="form-control form-select" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                    {FOLDERS.filter(f => f.name !== 'All Documents').map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} placeholder="Brief summary of the document contents..." value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input type="text" className="form-control" placeholder="e.g. outreach, budget, training (comma separated)" value={uploadTags} onChange={e => setUploadTags(e.target.value)} />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <label className="checkbox-wrapper" onClick={() => setUploadShared(!uploadShared)}>
                    <div className={`checkbox ${uploadShared ? 'checked' : ''}`}>
                      {uploadShared && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                    </div>
                    <span className="text-sm">Share globally (all regions can view)</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Edit Document Metadata</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {editError && <div className="alert alert-danger">{editError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Document Name <span>*</span></label>
                  <input type="text" className="form-control" required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Move to Folder / Category <span>*</span></label>
                  <select className="form-control form-select" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                    {FOLDERS.filter(f => f.name !== 'All Documents').map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} placeholder="Brief summary..." value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input type="text" className="form-control" placeholder="comma separated list" value={editTags} onChange={e => setEditTags(e.target.value)} />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <label className="checkbox-wrapper" onClick={() => setEditShared(!editShared)}>
                    <div className={`checkbox ${editShared ? 'checked' : ''}`}>
                      {editShared && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                    </div>
                    <span className="text-sm">Share globally (all regions can view)</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
