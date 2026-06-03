import { useState } from 'react';
import { FolderOpen, Search, Upload, Download, Eye, Tag, Clock, Users, Filter, Grid, List, FileText, Archive, Share2, X } from 'lucide-react';
import { mockDocuments, REGIONS } from '../../data/mockData';

const TYPE_COLORS = { pdf: '#ef4444', docx: '#1565c0', xlsx: '#166534', zip: '#6a1b9a', jpg: '#f9a825' };
const TYPE_ICONS = { pdf: '📄', docx: '📝', xlsx: '📊', zip: '🗜️', jpg: '🖼️' };
const FOLDERS = ['All Documents', 'Consolidated Reports', 'Planning Documents', 'Policies & Guidelines', 'Activity Photos', 'Training Materials', 'Prayer Documents', 'Schedules'];

export default function DocumentRepository() {
  const [activeFolder, setActiveFolder] = useState('All Documents');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const filtered = mockDocuments.filter(d => {
    if (activeFolder !== 'All Documents' && d.category !== activeFolder) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterRegion !== 'all' && !d.region.includes(filterRegion.split(' ')[0]) && d.region !== 'All Regions') return false;
    if (filterType !== 'all' && d.type !== filterType) return false;
    return true;
  });

  const handleUpload = async () => {
    document.getElementById('doc-upload').click();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FolderOpen size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Document Repository</h1>
          <p className="page-subtitle">{mockDocuments.length} documents · Centralized organizational archive</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input id="doc-upload" type="file" multiple hidden onChange={() => {}} />
          <button className="btn btn-primary" onClick={handleUpload}><Upload size={16} />Upload</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Folder tree */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ padding: '12px 0' }}>
            <p style={{ padding: '8px 16px 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Folders</p>
            {FOLDERS.map(f => (
              <button key={f} onClick={() => setActiveFolder(f)}
                style={{ width: '100%', padding: '9px 16px', textAlign: 'left', background: activeFolder === f ? 'var(--primary-50)' : 'transparent', color: activeFolder === f ? 'var(--primary)' : 'var(--text-primary)', fontWeight: activeFolder === f ? 600 : 400, fontSize: '0.85rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'all var(--transition)', borderLeft: activeFolder === f ? '3px solid var(--primary)' : '3px solid transparent' }}>
                <FolderOpen size={14} />
                <span className="truncate">{f}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {f === 'All Documents' ? mockDocuments.length : mockDocuments.filter(d => d.category === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search documents, tags..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control form-select" style={{ width: 160 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option value="all">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="form-control form-select" style={{ width: 120 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {['pdf', 'docx', 'xlsx', 'zip'].map(t => <option key={t} value={t}>.{t.toUpperCase()}</option>)}
            </select>
            <div className="tabs" style={{ width: 'auto' }}>
              {['grid', 'list'].map(v => <button key={v} className={`tab ${view === v ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 12px' }} onClick={() => setView(v)}>
                {v === 'grid' ? <Grid size={14} /> : <List size={14} />}
              </button>)}
            </div>
          </div>

          {/* Grid view */}
          {view === 'grid' && (
            <div className="grid grid-3">
              {filtered.map(d => (
                <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
                  <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '3rem' }}>{TYPE_ICONS[d.type] || '📄'}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: TYPE_COLORS[d.type] || '#6b7280', marginTop: 4, textTransform: 'uppercase' }}>.{d.type}</div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }} className="truncate">{d.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.size} · v{d.version}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {d.tags.slice(0, 2).map(t => <span key={t} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{t}</span>)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.date}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); }}><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); }}><Download size={13} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Name</th><th>Category</th><th>Region</th><th>Size</th><th>Version</th><th>Uploaded By</th><th>Date</th><th>Downloads</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>{TYPE_ICONS[d.type] || '📄'}</span>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</p>
                              <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                                {d.tags.slice(0, 2).map(t => <span key={t} className="badge badge-primary" style={{ fontSize: '0.62rem' }}>{t}</span>)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>{d.category}</td>
                        <td style={{ fontSize: '0.78rem' }}>{d.region}</td>
                        <td style={{ fontSize: '0.78rem' }}>{d.size}</td>
                        <td><span className="badge badge-gray">v{d.version}</span></td>
                        <td style={{ fontSize: '0.78rem' }}>{d.uploadedBy}</td>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.date}</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.downloads}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm"><Eye size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm"><Download size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm"><Share2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="empty-state card" style={{ padding: '60px' }}>
              <FolderOpen size={40} className="empty-state-icon" />
              <h3>No Documents Found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="truncate">{selected.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
                <div style={{ fontSize: '4rem' }}>{TYPE_ICONS[selected.type] || '📄'}</div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: TYPE_COLORS[selected.type], marginTop: 6, textTransform: 'uppercase' }}>{selected.type} File</p>
              </div>
              {[
                { label: 'Category', val: selected.category },
                { label: 'Region', val: selected.region },
                { label: 'File Size', val: selected.size },
                { label: 'Version', val: `v${selected.version}` },
                { label: 'Uploaded By', val: selected.uploadedBy },
                { label: 'Upload Date', val: selected.date },
                { label: 'Downloads', val: selected.downloads },
                { label: 'Shared', val: selected.shared ? 'Yes' : 'No' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>Tags</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.tags.map(t => <span key={t} className="badge badge-primary">{t}</span>)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary"><Share2 size={14} />Share</button>
              <button className="btn btn-primary"><Download size={14} />Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
