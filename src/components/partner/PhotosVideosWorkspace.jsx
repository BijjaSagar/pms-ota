import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  MEDIA_GROUPS,
  PHOTO_TAGS,
  PHOTO_TAG_OPTIONS,
  assignmentForMedia,
  countMediaByGroup,
  countMediaByTag,
  createInitialPhotosVideosState,
  makeMediaId,
  normalizePhotosVideosState,
  smartReorderMedia,
} from '../../lib/data/photosVideos.js';

const storageKey = (propertyId) => `triponx.partner.photosVideos.${propertyId ?? 'default'}.v1`;

function readState(propertyId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(propertyId)));
    return normalizePhotosVideosState(saved);
  } catch {
    return createInitialPhotosVideosState();
  }
}

const tagLabel = (tagId) => PHOTO_TAGS.find((tag) => tag.id === tagId)?.label ?? 'Media';

function MediaThumb({ item, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item?.url]);

  if (!item) return <div className={`pvm-thumb is-fallback ${className}`} />;

  if (item.type === 'video') {
    return (
      <span className={`pvm-thumb is-video ${className}`}>
        <video src={item.url} preload="metadata" muted playsInline />
        <span className="pvm-video-badge"><Video size={13} aria-hidden="true" />Video</span>
      </span>
    );
  }

  if (failed || !item.url) {
    return (
      <span className={`pvm-thumb is-fallback ${className}`}>
        <ImageIcon size={22} aria-hidden="true" />
        <small>{tagLabel(item.tag)}</small>
      </span>
    );
  }

  return (
    <img
      src={item.url}
      alt={item.name}
      className={`pvm-thumb ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function ModalShell({ title, subtitle, children, onClose, wide, footer }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="pvm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`pvm-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="pvm-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="pvm-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="pvm-modal-body">{children}</div>
        {footer ? <footer className="pvm-modal-foot">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

function Lightbox({ item, items, onClose, onNavigate, onSetCover }) {
  const touchX = useRef(null);

  if (typeof document === 'undefined' || !item) return null;

  return createPortal(
    <div
      className="pvm-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} preview`}
      onClick={onClose}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (Math.abs(distance) < 40) return;
        onNavigate(distance < 0 ? 1 : -1);
      }}
    >
      <button type="button" className="pvm-lightbox-close" onClick={onClose} aria-label="Close preview"><X size={20} aria-hidden="true" /></button>
      <button type="button" className="pvm-lightbox-nav is-prev" onClick={(event) => { event.stopPropagation(); onNavigate(-1); }} aria-label="Previous media"><ChevronLeft size={22} aria-hidden="true" /></button>
      <figure className="pvm-lightbox-figure" onClick={(event) => event.stopPropagation()}>
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay playsInline />
        ) : (
          <img src={item.url} alt={item.name} />
        )}
        <figcaption>
          <span>{item.name}</span>
          <small>{tagLabel(item.tag)}</small>
          <button type="button" className="pvm-lightbox-cover" onClick={() => onSetCover(item.id)}>Use as cover</button>
        </figcaption>
      </figure>
      <button type="button" className="pvm-lightbox-nav is-next" onClick={(event) => { event.stopPropagation(); onNavigate(1); }} aria-label="Next media"><ChevronRight size={22} aria-hidden="true" /></button>
      <span className="pvm-lightbox-count">{items.findIndex((entry) => entry.id === item.id) + 1} / {items.length}</span>
    </div>,
    document.body,
  );
}

export default function PhotosVideosWorkspace({ property }) {
  const propertyId = property?.id ?? 'default';
  const [state, setState] = useState(() => readState(propertyId));
  const [activeGroup, setActiveGroup] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [uploadGroup, setUploadGroup] = useState(MEDIA_GROUPS[0]?.id ?? '');
  const [uploadTag, setUploadTag] = useState('room');
  const [lightboxId, setLightboxId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dragId, setDragId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const next = readState(propertyId);
    setState(next);
    setActiveGroup('');
    setActiveTag('');
    setModal(null);
    setForm(null);
    setLightboxId(null);
    setNotice(null);
  }, [propertyId]);

  const updateState = (updater) => {
    setState((current) => {
      const next = updater(current);
      try {
        sessionStorage.setItem(storageKey(propertyId), JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  };

  const itemById = useMemo(() => Object.fromEntries(state.items.map((item) => [item.id, item])), [state.items]);
  const tagCounts = useMemo(() => countMediaByTag(state.items), [state.items]);
  const groupCounts = useMemo(() => countMediaByGroup(state.assignments), [state.assignments]);
  const orderedItems = useMemo(
    () => (state.smartReorder ? smartReorderMedia(state) : state.order).map((id) => itemById[id]).filter(Boolean),
    [state, itemById],
  );
  const visibleItems = useMemo(() => orderedItems.filter((item) => {
    const matchesGroup = !activeGroup || (state.assignments[activeGroup] ?? []).includes(item.id);
    const matchesTag = !activeTag || item.tag === activeTag;
    return matchesGroup && matchesTag;
  }), [orderedItems, activeGroup, activeTag, state.assignments]);
  const selectedCollectionLabel = activeGroup
    ? MEDIA_GROUPS.find((group) => group.id === activeGroup)?.label ?? ''
    : PHOTO_TAGS.find((tag) => tag.id === activeTag)?.label ?? '';
  const coverItem = itemById[state.coverId] ?? orderedItems[0] ?? null;
  const lightboxIndex = visibleItems.findIndex((item) => item.id === lightboxId);
  const lightboxItem = lightboxIndex >= 0 ? visibleItems[lightboxIndex] : null;

  const closeModal = useCallback(() => {
    setModal(null);
    setForm(null);
    setDragId(null);
  }, []);

  const navigateLightbox = useCallback((delta) => {
    if (!visibleItems.length) return;
    setLightboxId((current) => {
      const index = visibleItems.findIndex((item) => item.id === current);
      const nextIndex = (index + delta + visibleItems.length) % visibleItems.length;
      return visibleItems[nextIndex]?.id ?? null;
    });
  }, [visibleItems]);

  useEffect(() => {
    if (!modal && !lightboxItem) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (lightboxItem) setLightboxId(null);
        else closeModal();
      }
      if (lightboxItem && event.key === 'ArrowRight') navigateLightbox(1);
      if (lightboxItem && event.key === 'ArrowLeft') navigateLightbox(-1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [modal, lightboxItem, closeModal, navigateLightbox]);

  const itemsForGroup = (groupId) => (state.assignments[groupId] ?? []).map((id) => itemById[id]).filter(Boolean);

  const setCover = (id) => {
    updateState((current) => ({ ...current, coverId: id }));
    closeModal();
    setLightboxId(null);
    setNotice('Cover photo updated.');
  };

  const updateAssignment = (current, mediaId, groupId) => {
    const assignments = {};
    MEDIA_GROUPS.forEach((group) => {
      assignments[group.id] = (current.assignments[group.id] ?? []).filter((id) => id !== mediaId);
    });
    if (groupId) assignments[groupId] = [...(assignments[groupId] ?? []), mediaId];
    return assignments;
  };

  const saveEdit = () => {
    if (!form?.mediaId) return;
    updateState((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.id === form.mediaId ? { ...item, name: form.name.trim() || item.name, tag: form.tag } : item
      )),
      assignments: updateAssignment(current, form.mediaId, form.groupId),
    }));
    closeModal();
    setNotice('Media details updated.');
  };

  const saveAssignment = () => {
    if (!form?.groupId) return;
    const groupId = form.groupId;
    const selected = new Set(form.selectedIds ?? []);
    updateState((current) => {
      const assignments = { ...current.assignments };
      MEDIA_GROUPS.forEach((group) => {
        assignments[group.id] = (assignments[group.id] ?? []).filter((id) => !selected.has(id));
      });
      assignments[groupId] = [...new Set([...(assignments[groupId] ?? []), ...selected])];
      return { ...current, assignments };
    });
    closeModal();
    setNotice('Media assignments updated.');
  };

  const removeMedia = (mediaId) => {
    updateState((current) => {
      const items = current.items.filter((item) => item.id !== mediaId);
      const order = current.order.filter((id) => id !== mediaId);
      const assignments = {};
      MEDIA_GROUPS.forEach((group) => {
        assignments[group.id] = (current.assignments[group.id] ?? []).filter((id) => id !== mediaId);
      });
      return {
        ...current,
        items,
        order,
        assignments,
        coverId: current.coverId === mediaId ? (order[0] ?? null) : current.coverId,
      };
    });
    if (itemById[mediaId]?.url?.startsWith('blob:')) URL.revokeObjectURL(itemById[mediaId].url);
    if (lightboxId === mediaId) setLightboxId(null);
    closeModal();
    setNotice('Media removed from this session.');
  };

  const toggleSmartReorder = () => {
    updateState((current) => {
      const enabled = !current.smartReorder;
      return {
        ...current,
        smartReorder: enabled,
        order: enabled ? smartReorderMedia(current) : current.order,
      };
    });
    setNotice(state.smartReorder ? 'Manual order restored.' : 'Smart order applied.');
  };

  const moveBefore = (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return;
    updateState((current) => {
      const baseOrder = current.smartReorder ? smartReorderMedia(current) : current.order;
      const nextOrder = baseOrder.filter((id) => id !== sourceId);
      const targetIndex = targetId ? nextOrder.indexOf(targetId) : -1;
      const insertAt = targetIndex >= 0 ? targetIndex : nextOrder.length;
      nextOrder.splice(insertAt, 0, sourceId);
      return { ...current, order: nextOrder, smartReorder: false };
    });
    setDragId(null);
    setNotice('Media order updated.');
  };

  const openViewAll = (mode = 'view') => {
    setActiveGroup('');
    setActiveTag('');
    setModal({ type: 'viewAll', mode });
  };

  const openEdit = (mediaId) => {
    const item = itemById[mediaId];
    if (!item) return;
    setForm({
      mediaId,
      name: item.name,
      tag: item.tag,
      groupId: assignmentForMedia(state.assignments, mediaId),
    });
    setModal({ type: 'edit' });
  };

  const openAssignment = (groupId) => {
    setForm({ groupId, selectedIds: state.assignments[groupId] ?? [] });
    setModal({ type: 'assign', groupId });
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const newItems = files.map((file) => ({
      id: makeMediaId('upload'),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      tag: uploadTag,
      groupId: uploadGroup,
      local: true,
      sizeBytes: file.size,
    }));
    const ids = newItems.map((item) => item.id);
    updateState((current) => ({
      ...current,
      items: [...current.items, ...newItems],
      order: [...current.order, ...ids],
      assignments: {
        ...current.assignments,
        [uploadGroup]: [...(current.assignments[uploadGroup] ?? []), ...ids],
      },
    }));
    event.target.value = '';
    closeModal();
    setNotice(`${newItems.length} file${newItems.length === 1 ? '' : 's'} added for this session.`);
  };

  const renderGridCard = (item, options = {}) => {
    const draggable = Boolean(options.draggable);
    return (
      <article
        key={item.id}
        className={`pvm-media-card ${dragId === item.id ? 'is-dragging' : ''} ${draggable ? 'is-draggable' : ''}`}
        draggable={draggable}
        onDragStart={() => draggable && setDragId(item.id)}
        onDragOver={(event) => { if (draggable) event.preventDefault(); }}
        onDrop={(event) => {
          if (!draggable) return;
          event.preventDefault();
          moveBefore(dragId, item.id);
        }}
      >
        <button type="button" className="pvm-media-preview" onClick={() => setLightboxId(item.id)} aria-label={`Preview ${item.name}`}>
          <MediaThumb item={item} />
          {options.showDrag ? <span className="pvm-drag-handle"><GripVertical size={15} aria-hidden="true" /></span> : null}
          {state.coverId === item.id ? <span className="pvm-cover-badge"><Check size={12} aria-hidden="true" />Cover</span> : null}
        </button>
        <div className="pvm-media-meta">
          <strong title={item.name}>{item.name}</strong>
          <small>{tagLabel(item.tag)}</small>
        </div>
        <div className="pvm-media-actions">
          <button type="button" onClick={() => setCover(item.id)} aria-label={`Set ${item.name} as cover`}><ImageIcon size={14} aria-hidden="true" /></button>
          <button type="button" onClick={() => openEdit(item.id)} aria-label={`Edit ${item.name}`}><Pencil size={14} aria-hidden="true" /></button>
          <button type="button" onClick={() => removeMedia(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={14} aria-hidden="true" /></button>
        </div>
      </article>
    );
  };

  return (
    <div className="pvm-workspace">
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="sr-only" aria-label="Choose media files" onChange={handleFiles} />

      {notice ? (
        <div className="pvm-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={14} aria-hidden="true" /></button>
        </div>
      ) : null}

      <header className="pvm-header">
        <div className="pvm-heading">
          <span className="pvm-heading-icon"><ImageIcon size={20} aria-hidden="true" /></span>
          <div>
            <h3>Photos &amp; Videos ({state.items.length})</h3>
            <p>Review, tag and arrange the media guests see on your listing.</p>
          </div>
        </div>
        <div className="pvm-header-actions">
          <label className="pvm-smart">
            <span>
              <strong>Smart Reorder</strong>
              <small>{state.smartReorder ? 'Guest-focused order' : 'Manual order'}</small>
            </span>
            <button type="button" role="switch" aria-checked={state.smartReorder} aria-label="Smart Reorder" className={`pvm-switch ${state.smartReorder ? 'is-on' : ''}`} onClick={toggleSmartReorder}><span /></button>
          </label>
          <button type="button" className="pvm-btn" onClick={() => openViewAll('reorder')}><GripVertical size={15} aria-hidden="true" />Reorder</button>
          <button type="button" className="pvm-btn" onClick={() => openViewAll('view')}>View All</button>
          <button type="button" className="pvm-btn is-primary" onClick={() => { setUploadGroup(MEDIA_GROUPS[0]?.id ?? ''); setUploadTag('room'); setModal({ type: 'upload' }); }}><Upload size={15} aria-hidden="true" />Upload More</button>
        </div>
      </header>

      {coverItem ? (
        <section className="pvm-cover-card">
          <MediaThumb item={coverItem} className="pvm-cover-media" />
          <div className="pvm-cover-overlay">
            <span className="pvm-pill">Cover photo</span>
            <h3>{coverItem.name}</h3>
            <p>{tagLabel(coverItem.tag)} · {PHOTO_TAGS.length} tags available</p>
          </div>
          <button type="button" className="pvm-cover-change" onClick={() => setModal({ type: 'cover' })}><Pencil size={14} aria-hidden="true" />Change cover</button>
        </section>
      ) : null}

      <section className="pvm-block">
        <div className="pvm-block-head">
          <div>
            <h3>Assigned areas</h3>
            <p>Each file belongs to one room or dining area.</p>
          </div>
        </div>
        <div className="pvm-group-grid">
          {MEDIA_GROUPS.map((group) => {
            const items = itemsForGroup(group.id);
            return (
              <article className={`pvm-group-card ${activeGroup === group.id ? 'is-active' : ''}`} key={group.id}>
                <div className="pvm-group-thumbs">
                  {items.slice(0, 3).map((item) => <MediaThumb key={item.id} item={item} />)}
                  {!items.length ? <span className="pvm-group-empty"><ImageIcon size={20} aria-hidden="true" /></span> : null}
                </div>
                <div className="pvm-group-copy">
                  <strong>{group.label}</strong>
                  <span>{groupCounts[group.id] ?? 0} {group.kind === 'room' ? 'photos' : 'visuals'}</span>
                </div>
                <div className="pvm-group-actions">
                  <button type="button" onClick={() => { setActiveGroup(group.id); setActiveTag(''); }}>View</button>
                  <button type="button" onClick={() => openAssignment(group.id)}><Plus size={14} aria-hidden="true" />Add</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pvm-block">
        <div className="pvm-block-head">
          <div>
            <h3>Tagged media</h3>
            <p>Counts update as you edit tags or add files.</p>
          </div>
        </div>
        <div className="pvm-tag-grid">
          {PHOTO_TAGS.map((tag) => {
            const items = state.items.filter((item) => item.tag === tag.id);
            return (
              <button type="button" className={`pvm-tag-card ${activeTag === tag.id ? 'is-active' : ''}`} key={tag.id} onClick={() => { setActiveTag(activeTag === tag.id ? '' : tag.id); setActiveGroup(''); }}>
                <span className="pvm-tag-thumbs">
                  {items.slice(0, 3).map((item) => <MediaThumb key={item.id} item={item} />)}
                </span>
                <strong>{tag.label}</strong>
                <small>{tagCounts[tag.id] ?? 0} media</small>
              </button>
            );
          })}
        </div>
      </section>

      {selectedCollectionLabel ? (
        <section className="pvm-block pvm-collection-block">
          <div className="pvm-block-head">
            <div>
              <h3>{selectedCollectionLabel}</h3>
              <p>{visibleItems.length} media in this collection</p>
            </div>
            <button type="button" className="pvm-clear-filter" onClick={() => { setActiveGroup(''); setActiveTag(''); }}>
              Clear collection <X size={13} aria-hidden="true" />
            </button>
          </div>
          {visibleItems.length ? (
            <div className="pvm-collection-grid">{visibleItems.map((item) => renderGridCard(item))}</div>
          ) : (
            <div className="pvm-empty"><ImageIcon size={24} aria-hidden="true" /><strong>No media in this collection.</strong></div>
          )}
        </section>
      ) : null}

      {modal?.type === 'cover' ? (
        <ModalShell title="Choose cover photo" subtitle="Select the image guests see first." wide onClose={closeModal}>
          <div className="pvm-cover-picker">
            {orderedItems.map((item) => (
              <button type="button" key={item.id} className={`pvm-cover-option ${state.coverId === item.id ? 'is-active' : ''}`} onClick={() => setCover(item.id)}>
                <MediaThumb item={item} />
                <span>{item.name}</span>
                {state.coverId === item.id ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </ModalShell>
      ) : null}

      {modal?.type === 'edit' && form ? (
        <ModalShell
          title="Edit media"
          subtitle="Update the label, tag and assigned area."
          onClose={closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={saveEdit}>Save changes</button></>}
        >
          <div className="pvm-form-grid">
            <label className="pvm-field is-full"><span>Label</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="pvm-field"><span>Tag</span><select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}>{PHOTO_TAG_OPTIONS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></label>
            <label className="pvm-field"><span>Assigned area</span><select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}>{MEDIA_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
          </div>
          <button type="button" className="pvm-danger-link" onClick={() => removeMedia(form.mediaId)}><Trash2 size={14} aria-hidden="true" />Remove this file</button>
        </ModalShell>
      ) : null}

      {modal?.type === 'assign' && form ? (
        <ModalShell
          title={`Add media to ${MEDIA_GROUPS.find((group) => group.id === form.groupId)?.label ?? 'area'}`}
          subtitle="Select the files that belong to this area."
          wide
          onClose={closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={saveAssignment}>Save assignment</button></>}
        >
          <div className="pvm-assign-list">
            {state.items.map((item) => {
              const checked = form.selectedIds.includes(item.id);
              return (
                <label className={`pvm-assign-row ${checked ? 'is-checked' : ''}`} key={item.id}>
                  <input type="checkbox" checked={checked} onChange={() => setForm({ ...form, selectedIds: checked ? form.selectedIds.filter((id) => id !== item.id) : [...form.selectedIds, item.id] })} />
                  <MediaThumb item={item} />
                  <span>{item.name}</span>
                  <small>{tagLabel(item.tag)}</small>
                </label>
              );
            })}
          </div>
        </ModalShell>
      ) : null}

      {modal?.type === 'upload' ? (
        <ModalShell
          title="Upload more media"
          subtitle="Add local previews for images or videos."
          onClose={closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={() => fileInputRef.current?.click()}><Upload size={15} aria-hidden="true" />Choose files</button></>}
        >
          <div className="pvm-form-grid">
            <label className="pvm-field"><span>Assigned area</span><select value={uploadGroup} onChange={(event) => setUploadGroup(event.target.value)}>{MEDIA_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
            <label className="pvm-field"><span>Default tag</span><select value={uploadTag} onChange={(event) => setUploadTag(event.target.value)}>{PHOTO_TAG_OPTIONS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></label>
          </div>
          <p className="pvm-help">Files stay in this browser session. Use the edit action after uploading to adjust each item.</p>
        </ModalShell>
      ) : null}

      {modal?.type === 'viewAll' ? (
        <ModalShell
          title={modal.mode === 'reorder' ? 'Reorder media' : 'View all media'}
          subtitle={modal.mode === 'reorder' ? 'Drag cards into the order guests should see.' : 'Browse the full media library.'}
          wide
          onClose={closeModal}
        >
          <div className="pvm-filter-row">
            <label><span>Area</span><select value={activeGroup} onChange={(event) => setActiveGroup(event.target.value)}><option value="">All areas</option>{MEDIA_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
            <label><span>Tag</span><select value={activeTag} onChange={(event) => setActiveTag(event.target.value)}><option value="">All tags</option>{PHOTO_TAGS.map((tag) => <option key={tag.id} value={tag.id}>{tag.label}</option>)}</select></label>
          </div>
          <div className="pvm-modal-mosaic">
            {visibleItems.length ? visibleItems.map((item) => renderGridCard(item, { draggable: modal.mode === 'reorder', showDrag: modal.mode === 'reorder' })) : (
              <div className="pvm-empty"><ImageIcon size={24} aria-hidden="true" /><strong>No media matches this filter.</strong></div>
            )}
          </div>
        </ModalShell>
      ) : null}

      {lightboxItem ? (
        <Lightbox
          item={lightboxItem}
          items={visibleItems}
          onClose={() => setLightboxId(null)}
          onNavigate={navigateLightbox}
          onSetCover={setCover}
        />
      ) : null}

      <div className="pvm-mobile-actions">
        <button type="button" className="pvm-btn" onClick={() => openViewAll('view')}>View All</button>
        <button type="button" className="pvm-btn" onClick={() => openViewAll('reorder')}><GripVertical size={14} aria-hidden="true" />Reorder</button>
        <button type="button" className="pvm-btn is-primary" onClick={() => { setUploadGroup(MEDIA_GROUPS[0]?.id ?? ''); setUploadTag('room'); setModal({ type: 'upload' }); }}><Upload size={14} aria-hidden="true" />Upload More</button>
      </div>
    </div>
  );
}
