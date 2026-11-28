import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowDown, ArrowUp, BedDouble, Check, ChevronLeft, ChevronRight, GripVertical,
  Image as ImageIcon, Images, Link2, Pencil, Star, Tag, Trash2, Unlink, Upload, UtensilsCrossed, Video, X,
} from 'lucide-react';
import { MASTER_LISTS, masterLabel } from '../../lib/data/partner.js';
import {
  IMAGE_ACCEPT, IMAGE_MAX_BYTES, IMAGE_TYPES, VIDEO_ACCEPT, VIDEO_MAX_BYTES,
  deleteMedia, getAmenities, loadMasters, reorderMedia, setCover, updateMedia,
  uploadImage, uploadVideo, usePrivateUrl,
} from '../../lib/api/properties.js';

// Photos & Videos, saved on the server (property_media). Files are private:
// every thumbnail is fetched with the partner token (usePrivateUrl). A file
// can show one room or one restaurant; every gallery photo needs a tag.

const MAX_IMAGES = 50;
const MAX_VIDEOS = 5;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const NONE = '';
const areaValue = (item) => (item.roomTypeId ? `room:${item.roomTypeId}` : item.restaurantId ? `restaurant:${item.restaurantId}` : NONE);
const areaBody = (value) => ({
  roomTypeId: value.startsWith('room:') ? value.slice(5) : null,
  restaurantId: value.startsWith('restaurant:') ? value.slice(11) : null,
});
const tagLabel = (item) => (item.kind === 'video' ? 'Video' : item.tag ? masterLabel('photoTag', item.tag) : 'Needs a tag');
const landscape = (item) => item.kind === 'image' && (item.width ?? 0) > (item.height ?? 0);
const mb = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

function MediaThumb({ item, className = '' }) {
  const { url, failed } = usePrivateUrl(item?.url);
  if (!item) return <span className={`pvm-thumb is-fallback ${className}`} />;
  if (failed || !url) {
    return (
      <span className={`pvm-thumb is-fallback ${className}`} aria-busy={!failed}>
        {item.kind === 'video' ? <Video size={20} aria-hidden="true" /> : <ImageIcon size={20} aria-hidden="true" />}
        <small>{failed ? 'Could not load' : 'Loading…'}</small>
      </span>
    );
  }
  if (item.kind === 'video') {
    return (
      <span className={`pvm-thumb is-video ${className}`}>
        <video src={url} preload="metadata" muted playsInline />
        <span className="pvm-video-badge"><Video size={13} aria-hidden="true" />Video</span>
      </span>
    );
  }
  return <img src={url} alt={item.caption || item.name} className={`pvm-thumb ${className}`} decoding="async" />;
}

function ModalShell({ title, subtitle, children, onClose, wide, footer }) {
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

function LightboxMedia({ item }) {
  const { url, failed } = usePrivateUrl(item.url);
  if (!url) return <div className="pvm-lightbox-loading">{failed ? 'This file could not be loaded.' : 'Loading…'}</div>;
  return item.kind === 'video'
    ? <video src={url} controls autoPlay playsInline />
    : <img src={url} alt={item.caption || item.name} />;
}

function Lightbox({ item, items, onClose, onNavigate, onSetCover, busy }) {
  const touchX = useRef(null);
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
        if (Math.abs(distance) >= 40) onNavigate(distance < 0 ? 1 : -1);
      }}
    >
      <button type="button" className="pvm-lightbox-close" onClick={onClose} aria-label="Close preview"><X size={20} aria-hidden="true" /></button>
      {items.length > 1 ? <button type="button" className="pvm-lightbox-nav is-prev" onClick={(event) => { event.stopPropagation(); onNavigate(-1); }} aria-label="Previous"><ChevronLeft size={22} aria-hidden="true" /></button> : null}
      <figure className="pvm-lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <LightboxMedia item={item} />
        <figcaption>
          <span>{item.caption || item.name}</span>
          <small>{tagLabel(item)}</small>
          {landscape(item) ? <button type="button" className="pvm-lightbox-cover" disabled={busy} onClick={() => onSetCover(item.id)}>Use as cover</button> : null}
        </figcaption>
      </figure>
      {items.length > 1 ? <button type="button" className="pvm-lightbox-nav is-next" onClick={(event) => { event.stopPropagation(); onNavigate(1); }} aria-label="Next"><ChevronRight size={22} aria-hidden="true" /></button> : null}
      <span className="pvm-lightbox-count">{items.findIndex((entry) => entry.id === item.id) + 1} / {items.length}</span>
    </div>,
    document.body,
  );
}

export default function PhotosVideosWorkspace({ property, onPropertyChange }) {
  const propertyId = property.id;
  const photos = property.photos ?? { cover: null, images: [], videos: [] };
  const rooms = useMemo(() => (property.rooms ?? []).map((room) => ({ id: room.id, name: room.roomName || 'Room' })), [property.rooms]);
  const [restaurants, setRestaurants] = useState([]);
  const [ready, setReady] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = ['rooms', 'tags'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'gallery';
  const [kindFilter, setKindFilter] = useState('all'); // gallery: all | image | video
  const [areaPick, setAreaPick] = useState(null); // rooms tab: picked room / restaurant ('' = not linked)
  const [tagPick, setTagPick] = useState(null); // tags tab: picked tag ('' = needs a tag)
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [lightboxId, setLightboxId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragId, setDragId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadMasters(), getAmenities(propertyId)])
      .then(([, amenities]) => { if (active) setRestaurants(amenities.restaurants.map((item) => ({ id: item.id, name: item.name }))); })
      .catch(() => { if (active) setNotice({ kind: 'error', text: 'Restaurants could not be loaded; you can still manage photos.' }); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [propertyId]);

  const gallery = useMemo(() => [...photos.images, ...photos.videos], [photos.images, photos.videos]);
  const byId = useMemo(() => Object.fromEntries(gallery.map((item) => [item.id, item])), [gallery]);
  const cover = photos.cover;
  const tags = MASTER_LISTS.photoTag ?? [];
  const untagged = photos.images.filter((item) => !item.tag);
  const areas = useMemo(() => [
    ...rooms.map((room) => ({ value: `room:${room.id}`, label: room.name, kind: 'Room' })),
    ...restaurants.map((item) => ({ value: `restaurant:${item.id}`, label: item.name, kind: 'Restaurant' })),
  ], [rooms, restaurants]);
  const areaLabel = (value) => areas.find((area) => area.value === value)?.label ?? '';

  const unlinked = gallery.filter((item) => !areaValue(item));
  const usedTags = tags.filter(([code]) => photos.images.some((item) => item.tag === code));
  // Keep the pick only while it still exists (a room deleted, the last photo of a tag retagged…).
  const selectedArea = areaPick !== null && (areas.some((area) => area.value === areaPick) || (areaPick === NONE && unlinked.length))
    ? areaPick : (areas[0]?.value ?? NONE);
  const selectedTag = tagPick !== null && (usedTags.some(([code]) => code === tagPick) || (tagPick === NONE && untagged.length))
    ? tagPick : (untagged.length ? NONE : usedTags[0]?.[0] ?? null);

  const visible = tab === 'rooms' ? gallery.filter((item) => areaValue(item) === selectedArea)
    : tab === 'tags' ? photos.images.filter((item) => (selectedTag === NONE ? !item.tag : item.tag === selectedTag))
      : gallery.filter((item) => kindFilter === 'all' || item.kind === kindFilter);
  const lightboxItems = modal ? gallery : visible;

  const changeTab = (next) => {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams);
    if (next === 'gallery') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
    setNotice(null);
  };
  const lightboxItem = lightboxId ? lightboxItems.find((item) => item.id === lightboxId) : null;

  const closeModal = useCallback(() => { setModal(null); setForm(null); setErrors({}); setDragId(null); }, []);
  const navigateLightbox = useCallback((delta) => {
    setLightboxId((current) => {
      const index = lightboxItems.findIndex((item) => item.id === current);
      return lightboxItems[(index + delta + lightboxItems.length) % lightboxItems.length]?.id ?? null;
    });
  }, [lightboxItems]);

  useEffect(() => {
    if (!modal && !lightboxItem) return undefined;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') { if (lightboxItem) setLightboxId(null); else if (!busy) closeModal(); }
      if (lightboxItem && event.key === 'ArrowRight') navigateLightbox(1);
      if (lightboxItem && event.key === 'ArrowLeft') navigateLightbox(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); };
  }, [modal, lightboxItem, closeModal, navigateLightbox, busy]);

  /** Runs a save; the server answers with the whole property. */
  const run = async (action, success) => {
    setBusy(true);
    setNotice(null);
    try {
      const detail = await action();
      if (detail?.photos) onPropertyChange?.(detail);
      if (success) setNotice({ kind: 'success', text: success });
      return true;
    } catch (problem) {
      const fields = problem?.fieldErrors ?? {};
      if (modal && Object.keys(fields).length) setErrors(Object.fromEntries(Object.entries(fields).map(([key, message]) => [key, /^[A-Z]/.test(message) ? message : `This ${message}.`])));
      else setNotice({ kind: 'error', text: problem?.message || 'That did not save. Please try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const chooseCover = async (mediaId) => {
    if (await run(() => setCover(propertyId, mediaId), 'Cover photo updated.')) { closeModal(); setLightboxId(null); }
  };

  // ------------------------------------------------------------- edit one
  const openEdit = (item) => {
    setForm({ id: item.id, kind: item.kind, name: item.name, tag: item.tag ?? '', caption: item.caption ?? '', area: areaValue(item), confirmRemove: false });
    setErrors({});
    setModal({ type: 'edit' });
  };
  const saveEdit = async () => {
    const item = byId[form.id];
    const problems = {};
    if (form.kind === 'image' && !form.tag) problems.tag = 'Choose what the photo shows.';
    if (form.caption.trim().length > 150) problems.caption = 'Keep the caption under 150 characters.';
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const body = {};
    if (form.kind === 'image' && form.tag !== (item.tag ?? '')) body.tag = form.tag;
    if (form.caption.trim() !== (item.caption ?? '')) body.caption = form.caption.trim() || null;
    if (form.area !== areaValue(item)) Object.assign(body, areaBody(form.area));
    if (!Object.keys(body).length) { closeModal(); return; }
    if (await run(() => updateMedia(propertyId, form.id, body), 'Details saved.')) closeModal();
  };
  const removeOne = async (item) => {
    if (await run(() => deleteMedia(propertyId, item.id), `${item.kind === 'video' ? 'Video' : 'Photo'} deleted.`)) {
      if (lightboxId === item.id) setLightboxId(null);
      closeModal();
    }
  };

  // -------------------------------------------------------- link to an area
  const openAssign = (value) => {
    setForm({ area: value, selected: gallery.filter((item) => areaValue(item) === value).map((item) => item.id) });
    setModal({ type: 'assign' });
  };
  const saveAssign = async () => {
    const before = new Set(gallery.filter((item) => areaValue(item) === form.area).map((item) => item.id));
    const after = new Set(form.selected);
    const changes = [
      ...[...after].filter((id) => !before.has(id)).map((id) => [id, areaBody(form.area)]),
      ...[...before].filter((id) => !after.has(id)).map((id) => [id, { roomTypeId: null, restaurantId: null }]),
    ];
    if (!changes.length) { closeModal(); return; }
    const ok = await run(async () => {
      let detail = null;
      for (const [id, body] of changes) detail = await updateMedia(propertyId, id, body);
      return detail;
    }, `${areaLabel(form.area)} updated.`);
    if (ok) closeModal();
  };

  // ----------------------------------------------------------------- upload
  const openUpload = () => {
    // Opened from a room or a tag: new files land there straight away.
    setForm({ area: tab === 'rooms' ? selectedArea : NONE, tag: tab === 'tags' && selectedTag ? selectedTag : '' });
    setErrors({});
    setModal({ type: 'upload' });
  };
  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    let images = photos.images.length;
    let videos = photos.videos.length;
    const failed = [];
    let detail = null;
    let done = 0;
    setBusy(true);
    setNotice(null);
    for (const [index, file] of files.entries()) {
      setProgress({ index: index + 1, total: files.length, name: file.name });
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) { failed.push(`${file.name}: use JPEG, PNG or WebP photos, or MP4, MOV or WebM videos.`); continue; }
      if (isImage && file.size > IMAGE_MAX_BYTES) { failed.push(`${file.name}: photos can be up to ${mb(IMAGE_MAX_BYTES)}.`); continue; }
      if (isVideo && file.size > VIDEO_MAX_BYTES) { failed.push(`${file.name}: videos can be up to ${mb(VIDEO_MAX_BYTES)}.`); continue; }
      if (isImage && images >= MAX_IMAGES) { failed.push(`${file.name}: a property can have ${MAX_IMAGES} photos.`); continue; }
      if (isVideo && videos >= MAX_VIDEOS) { failed.push(`${file.name}: a property can have ${MAX_VIDEOS} videos.`); continue; }
      try {
        const known = new Set(isImage ? (detail ?? property).photos.images.map((item) => item.id) : (detail ?? property).photos.videos.map((item) => item.id));
        detail = await (isImage ? uploadImage(propertyId, file, 'gallery') : uploadVideo(propertyId, file));
        const added = (isImage ? detail.photos.images : detail.photos.videos).find((item) => !known.has(item.id));
        const body = { ...(form.area ? areaBody(form.area) : {}), ...(isImage && form.tag ? { tag: form.tag } : {}) };
        if (added && Object.keys(body).length) detail = await updateMedia(propertyId, added.id, body);
        if (isImage) images += 1; else videos += 1;
        done += 1;
      } catch (problem) {
        failed.push(`${file.name}: ${problem?.message || 'could not be uploaded.'}`);
      }
    }
    if (detail) onPropertyChange?.(detail);
    setProgress(null);
    setBusy(false);
    if (failed.length) {
      setErrors({ files: failed });
      if (done) setNotice({ kind: 'success', text: `${done} file${done === 1 ? '' : 's'} uploaded.` });
    } else {
      closeModal();
      setNotice({ kind: 'success', text: `${done} file${done === 1 ? '' : 's'} uploaded.${!form.tag && files.some((file) => IMAGE_TYPES.includes(file.type)) ? ' Give each photo a tag.' : ''}` });
    }
  };

  // ---------------------------------------------------------------- reorder
  const openReorder = () => { setForm({ order: gallery.map((item) => item.id) }); setModal({ type: 'reorder' }); };
  const move = (id, targetIndex) => setForm((current) => {
    const order = current.order.filter((item) => item !== id);
    order.splice(Math.max(0, Math.min(targetIndex, order.length)), 0, id);
    return { ...current, order };
  });
  const saveOrder = async () => {
    if (form.order.every((id, index) => id === gallery[index]?.id)) { closeModal(); return; }
    if (await run(() => reorderMedia(propertyId, form.order), 'Gallery order saved.')) closeModal();
  };

  // ------------------------------------------------------------------- view
  // One file: picture first, quick actions on the picture, what it is underneath.
  const tile = (item) => {
    const isCover = cover?.id === item.id;
    const area = areaValue(item);
    return (
      <article key={item.id} className={`pvm-tile ${isCover ? 'is-cover' : ''}`}>
        <button type="button" className="pvm-tile-media" onClick={() => setLightboxId(item.id)} aria-label={`Preview ${item.caption || item.name}`}>
          <MediaThumb item={item} />
          <span className="pvm-tile-badges">
            {isCover ? <span className="pvm-badge is-cover"><Star size={11} aria-hidden="true" />Cover</span> : null}
            {item.kind === 'image' && !item.tag ? <span className="pvm-badge is-warn"><AlertTriangle size={11} aria-hidden="true" />No tag</span> : null}
          </span>
        </button>
        <span className="pvm-tile-tools">
          {landscape(item) && !isCover ? (
            <button type="button" disabled={busy} onClick={() => chooseCover(item.id)} aria-label={`Use ${item.name} as cover`} title="Use as cover"><Star size={14} aria-hidden="true" /></button>
          ) : null}
          <button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} title="Edit details"><Pencil size={14} aria-hidden="true" /></button>
        </span>
        <div className="pvm-tile-body">
          <strong title={item.caption || item.name}>{item.caption || item.name}</strong>
          <span className="pvm-tile-meta">
            <span className={`pvm-chip ${item.kind === 'image' && !item.tag ? 'is-warn' : ''}`}>{tagLabel(item)}</span>
            {area ? <span className="pvm-tile-area" title={areaLabel(area)}>{areaLabel(area)}</span> : null}
          </span>
        </div>
      </article>
    );
  };

  const tileGrid = (items) => <div className="pvm-tile-grid">{items.map(tile)}</div>;

  const uploadBtn = (
    <button type="button" className="pvm-btn is-primary" onClick={openUpload} disabled={busy}><Upload size={15} aria-hidden="true" />Upload</button>
  );

  const TABS = [
    { id: 'gallery', label: 'Gallery', Icon: Images, count: gallery.length },
    { id: 'rooms', label: 'Rooms & restaurants', Icon: BedDouble, count: areas.length },
    { id: 'tags', label: 'By tag', Icon: Tag, count: usedTags.length + (untagged.length ? 1 : 0) },
  ];
  const rooms_ = areas.filter((area) => area.kind === 'Room');
  const restaurants_ = areas.filter((area) => area.kind === 'Restaurant');
  const areaRow = ({ value, label, kind }) => {
    const items = gallery.filter((item) => areaValue(item) === value);
    const Icon = kind === 'Restaurant' ? UtensilsCrossed : kind === 'Room' ? BedDouble : Unlink;
    return (
      <button type="button" key={value || 'none'} className={`pvm-area-row ${selectedArea === value ? 'is-on' : ''}`}
        aria-pressed={selectedArea === value} onClick={() => setAreaPick(value)}>
        <span className="pvm-area-thumb">{items[0] ? <MediaThumb item={items[0]} /> : <Icon size={17} aria-hidden="true" />}</span>
        <span className="pvm-area-copy">
          <strong>{label}</strong>
          <small className={items.length ? '' : 'is-empty'}>{items.length ? `${items.length} file${items.length === 1 ? '' : 's'}` : 'No photos yet'}</small>
        </span>
      </button>
    );
  };
  const selectedAreaInfo = selectedArea === NONE
    ? { label: 'Not linked', kind: 'Files not linked to a room or restaurant' }
    : areas.find((area) => area.value === selectedArea);

  return (
    <div className="pvm-workspace">
      {notice ? (
        <div className={`pvm-notice ${notice.kind === 'error' ? 'is-error' : ''}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={14} aria-hidden="true" /></button>
        </div>
      ) : null}

      {untagged.length ? (
        <button type="button" className="pvm-warning" onClick={() => { setTagPick(NONE); changeTab('tags'); }}>
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{untagged.length} photo{untagged.length === 1 ? ' needs' : 's need'} a tag before this section is complete. <u>Tag them now</u></span>
        </button>
      ) : null}

      {/* The section title is already above: one bar with the views on the left and Upload on the right. */}
      <div className="pvm-bar">
        <nav className="pvm-tabs" aria-label="Photos and videos views">
          {TABS.map(({ id, label, Icon, count }) => (
            <button type="button" key={id} className={tab === id ? 'is-on' : ''} aria-pressed={tab === id} onClick={() => changeTab(id)}>
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
              <em>{count}</em>
            </button>
          ))}
        </nav>
        <div className="pvm-header-actions">
          <span className="pvm-quota" title={`Up to ${MAX_IMAGES} photos and ${MAX_VIDEOS} videos`}>
            <span><ImageIcon size={13} aria-hidden="true" />{photos.images.length}/{MAX_IMAGES}</span>
            <span><Video size={13} aria-hidden="true" />{photos.videos.length}/{MAX_VIDEOS}</span>
          </span>
          {/* Rooms tab: Upload sits next to the picked room instead. */}
          {tab !== 'rooms' || !areas.length ? uploadBtn : null}
        </div>
      </div>

      {tab === 'gallery' ? (
        <section className="pvm-panel" aria-label="Gallery">
          {cover ? (
            <section className="pvm-cover-card">
              <MediaThumb item={cover} className="pvm-cover-media" />
              <div className="pvm-cover-overlay">
                <span className="pvm-pill">Cover photo</span>
                <h3>{cover.caption || cover.name}</h3>
                <p>{cover.tag ? masterLabel('photoTag', cover.tag) : 'The first photo guests see'}</p>
              </div>
              <button type="button" className="pvm-cover-change" onClick={() => setModal({ type: 'cover' })} disabled={busy}><Pencil size={14} aria-hidden="true" />Change cover</button>
            </section>
          ) : (
            <section className="pvm-empty pvm-cover-missing">
              <ImageIcon size={26} aria-hidden="true" />
              <strong>No cover photo yet</strong>
              <span>Guests see the cover first. Choose a landscape (wide) photo.</span>
              {photos.images.some(landscape)
                ? <button type="button" className="pvm-btn is-primary" onClick={() => setModal({ type: 'cover' })}>Choose cover</button>
                : uploadBtn}
            </section>
          )}

          {gallery.length ? (
            <>
              <div className="pvm-toolbar">
                <div className="pvm-segment" role="group" aria-label="Show">
                  {[['all', 'All', gallery.length], ['image', 'Photos', photos.images.length], ['video', 'Videos', photos.videos.length]].map(([id, label, count]) => (
                    <button type="button" key={id} className={kindFilter === id ? 'is-on' : ''} aria-pressed={kindFilter === id} onClick={() => setKindFilter(id)} disabled={!count && id !== 'all'}>
                      {label} <em>{count}</em>
                    </button>
                  ))}
                </div>
                <button type="button" className="pvm-btn" onClick={openReorder} disabled={gallery.length < 2 || busy}><GripVertical size={15} aria-hidden="true" />Reorder</button>
              </div>
              {tileGrid(visible)}
            </>
          ) : (
            <section className="pvm-empty is-roomy">
              <span className="pvm-empty-icon"><Upload size={22} aria-hidden="true" /></span>
              <strong>No photos or videos yet</strong>
              <span>Upload photos of rooms, bathrooms, the entrance and common areas.</span>
              {uploadBtn}
            </section>
          )}
        </section>
      ) : null}

      {tab === 'rooms' ? (
        !ready ? <p className="pvm-help">Loading…</p> : !areas.length ? (
          <section className="pvm-empty is-roomy">
            <span className="pvm-empty-icon"><BedDouble size={22} aria-hidden="true" /></span>
            <strong>No rooms or restaurants yet</strong>
            <span>Add rooms in Rooms &amp; Rateplans, or restaurants in Amenities &amp; Restaurant, then link photos to them here.</span>
          </section>
        ) : (
          <section className="pvm-split" aria-label="Rooms and restaurants">
            <aside className="pvm-area-list" aria-label="Choose a room or restaurant">
              {rooms_.length ? <p className="pvm-area-group">Rooms</p> : null}
              {rooms_.map(areaRow)}
              {restaurants_.length ? <p className="pvm-area-group">Restaurants</p> : null}
              {restaurants_.map(areaRow)}
              {unlinked.length ? (
                <>
                  <p className="pvm-area-group">Other</p>
                  {areaRow({ value: NONE, label: 'Not linked', kind: 'None' })}
                </>
              ) : null}
            </aside>

            <div className="pvm-area-detail">
              <header className="pvm-area-head">
                <div>
                  <h3>{selectedAreaInfo?.label}</h3>
                  <p>{selectedArea === NONE ? selectedAreaInfo.kind : `${selectedAreaInfo?.kind} · ${visible.length} file${visible.length === 1 ? '' : 's'}`}</p>
                </div>
                {selectedArea !== NONE ? (
                  <div className="pvm-area-actions">
                    <button type="button" className="pvm-btn" onClick={() => openAssign(selectedArea)} disabled={!gallery.length || busy}><Link2 size={15} aria-hidden="true" />Link existing</button>
                    {uploadBtn}
                  </div>
                ) : null}
              </header>
              {visible.length ? tileGrid(visible) : (
                <div className="pvm-empty">
                  <span className="pvm-empty-icon"><ImageIcon size={22} aria-hidden="true" /></span>
                  <strong>No photos of {selectedAreaInfo?.label} yet</strong>
                  <span>{gallery.length ? 'Pick files you already uploaded, or upload new ones for it.' : 'Upload photos and they are linked here straight away.'}</span>
                </div>
              )}
            </div>
          </section>
        )
      ) : null}

      {tab === 'tags' ? (
        !photos.images.length ? (
          <section className="pvm-empty is-roomy">
            <span className="pvm-empty-icon"><Tag size={22} aria-hidden="true" /></span>
            <strong>No photos to tag yet</strong>
            <span>Every photo gets a tag (bedroom, bathroom, lobby…) so guests can browse by what it shows.</span>
            {uploadBtn}
          </section>
        ) : (
          <section className="pvm-panel" aria-label="Photos by tag">
            <div className="pvm-tag-chips" role="group" aria-label="Choose a tag">
              {untagged.length ? (
                <button type="button" className={`pvm-tag-chip is-warn ${selectedTag === NONE ? 'is-on' : ''}`} aria-pressed={selectedTag === NONE} onClick={() => setTagPick(NONE)}>
                  <AlertTriangle size={13} aria-hidden="true" />Needs a tag <em>{untagged.length}</em>
                </button>
              ) : null}
              {usedTags.map(([code, label]) => (
                <button type="button" key={code} className={`pvm-tag-chip ${selectedTag === code ? 'is-on' : ''}`} aria-pressed={selectedTag === code} onClick={() => setTagPick(code)}>
                  {label} <em>{photos.images.filter((item) => item.tag === code).length}</em>
                </button>
              ))}
            </div>
            {selectedTag === NONE ? <p className="pvm-help">Open a photo with the pencil and choose what it shows.</p> : null}
            {tileGrid(visible)}
          </section>
        )
      ) : null}

      {modal?.type === 'cover' ? (
        <ModalShell title="Choose the cover photo" subtitle="Only landscape (wide) photos can be the cover." wide onClose={closeModal}>
          {cover && !photos.images.some((item) => item.id === cover.id) ? (
            <p className="pvm-cover-note" role="note"><AlertTriangle size={14} aria-hidden="true" />The current cover was uploaded on its own (it is not in the gallery). Choosing another photo deletes it.</p>
          ) : null}
          {photos.images.some(landscape) ? (
            <div className="pvm-cover-picker">
              {photos.images.filter(landscape).map((item) => (
                <button type="button" key={item.id} disabled={busy} className={`pvm-cover-option ${cover?.id === item.id ? 'is-active' : ''}`} onClick={() => chooseCover(item.id)}>
                  <MediaThumb item={item} />
                  <span>{item.caption || item.name}</span>
                  {cover?.id === item.id ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          ) : <p className="pvm-help">No landscape photo yet. Upload a wide photo first.</p>}
        </ModalShell>
      ) : null}

      {modal?.type === 'edit' && form ? (
        <ModalShell
          title={form.kind === 'video' ? 'Edit video' : 'Edit photo'}
          subtitle={form.name}
          onClose={busy ? () => {} : closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal} disabled={busy}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={saveEdit} disabled={busy || form.confirmRemove}>{busy ? 'Saving…' : 'Save'}</button></>}
        >
          <div className="pvm-edit-preview"><MediaThumb item={byId[form.id]} /></div>
          <div className="pvm-form-grid">
            {form.kind === 'image' ? (
              <label className="pvm-field">
                <span>What it shows *</span>
                <select value={form.tag} onChange={(event) => { setForm({ ...form, tag: event.target.value }); setErrors({ ...errors, tag: undefined }); }} aria-invalid={Boolean(errors.tag)}>
                  <option value="">Choose a tag</option>
                  {tags.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
                {errors.tag ? <small className="pvm-error" role="alert">{errors.tag}</small> : null}
              </label>
            ) : null}
            <label className={`pvm-field ${form.kind === 'image' ? '' : 'is-full'}`}>
              <span>Room or restaurant</span>
              <select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })}>
                <option value="">Not linked</option>
                {rooms.length ? <optgroup label="Rooms">{areas.filter((area) => area.kind === 'Room').map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</optgroup> : null}
                {restaurants.length ? <optgroup label="Restaurants">{areas.filter((area) => area.kind === 'Restaurant').map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}</optgroup> : null}
              </select>
              {errors.roomTypeId || errors.restaurantId ? <small className="pvm-error" role="alert">{errors.roomTypeId || errors.restaurantId}</small> : null}
            </label>
            <label className="pvm-field is-full">
              <span>Caption (optional)</span>
              <input value={form.caption} maxLength={150} onChange={(event) => { setForm({ ...form, caption: event.target.value }); setErrors({ ...errors, caption: undefined }); }} placeholder="e.g. King bed with city view" />
              <small className="pvm-counter">{form.caption.length}/150</small>
              {errors.caption ? <small className="pvm-error" role="alert">{errors.caption}</small> : null}
            </label>
          </div>
          {form.confirmRemove ? (
            <div className="pvm-danger-box" role="alertdialog" aria-label="Delete this file">
              <div>
                <strong>Delete this {form.kind === 'video' ? 'video' : 'photo'}?</strong>
                <p>{cover?.id === form.id ? 'It is the cover photo; the listing will have no cover until you choose another. ' : ''}This can not be undone.</p>
              </div>
              <div className="pvm-danger-actions">
                <button type="button" className="pvm-btn" autoFocus onClick={() => setForm({ ...form, confirmRemove: false })}>No, keep it</button>
                <button type="button" className="pvm-btn is-solid-danger" disabled={busy} onClick={() => removeOne(byId[form.id])}><Trash2 size={14} aria-hidden="true" />{busy ? 'Deleting…' : 'Yes, delete'}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="pvm-danger-link" onClick={() => setForm({ ...form, confirmRemove: true })}><Trash2 size={14} aria-hidden="true" />Delete this file</button>
          )}
        </ModalShell>
      ) : null}

      {modal?.type === 'assign' && form ? (
        <ModalShell
          title={`Files of ${areaLabel(form.area)}`}
          subtitle="Tick the photos and videos that show it. A file can belong to one room or restaurant."
          wide
          onClose={busy ? () => {} : closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal} disabled={busy}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={saveAssign} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}
        >
          <div className="pvm-assign-list">
            {gallery.map((item) => {
              const checked = form.selected.includes(item.id);
              const elsewhere = !checked && areaValue(item) && areaValue(item) !== form.area ? areaLabel(areaValue(item)) : '';
              return (
                <label className={`pvm-assign-row ${checked ? 'is-checked' : ''}`} key={item.id}>
                  <input type="checkbox" checked={checked} onChange={() => setForm({ ...form, selected: checked ? form.selected.filter((id) => id !== item.id) : [...form.selected, item.id] })} />
                  <MediaThumb item={item} />
                  <span>{item.caption || item.name}</span>
                  <small>{elsewhere ? `Moves from ${elsewhere}` : tagLabel(item)}</small>
                </label>
              );
            })}
          </div>
        </ModalShell>
      ) : null}

      {modal?.type === 'upload' && form ? (
        <ModalShell
          title="Upload photos and videos"
          subtitle={`Photos: JPEG, PNG or WebP up to ${mb(IMAGE_MAX_BYTES)}. Videos: MP4, MOV or WebM up to ${mb(VIDEO_MAX_BYTES)}.`}
          onClose={busy ? () => {} : closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal} disabled={busy}>{errors.files ? 'Done' : 'Cancel'}</button><button type="button" className="pvm-btn is-primary" onClick={() => fileInputRef.current?.click()} disabled={busy}><Upload size={15} aria-hidden="true" />{busy ? 'Uploading…' : 'Choose files'}</button></>}
        >
          <input ref={fileInputRef} type="file" accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`} multiple className="sr-only" aria-label="Choose files" onChange={handleFiles} />
          <div className="pvm-form-grid">
            <label className="pvm-field">
              <span>Room or restaurant (optional)</span>
              <select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} disabled={busy}>
                <option value="">Not linked</option>
                {areas.map((area) => <option key={area.value} value={area.value}>{area.kind}: {area.label}</option>)}
              </select>
            </label>
            <label className="pvm-field">
              <span>Tag for the photos (optional)</span>
              <select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} disabled={busy}>
                <option value="">Tag them later</option>
                {tags.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
          </div>
          {progress ? <p className="pvm-progress" role="status">Uploading {progress.index} of {progress.total}: {progress.name}</p> : null}
          {errors.files ? (
            <div className="pvm-upload-errors" role="alert">
              <strong>{errors.files.length} file{errors.files.length === 1 ? ' was' : 's were'} not uploaded</strong>
              <ul>{errors.files.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
        </ModalShell>
      ) : null}

      {modal?.type === 'reorder' && form ? (
        <ModalShell
          title="Reorder the gallery"
          subtitle="Drag files, or use the arrows. Guests see them in this order."
          wide
          onClose={busy ? () => {} : closeModal}
          footer={<><button type="button" className="pvm-btn" onClick={closeModal} disabled={busy}>Cancel</button><button type="button" className="pvm-btn is-primary" onClick={saveOrder} disabled={busy}>{busy ? 'Saving…' : 'Save order'}</button></>}
        >
          <ol className="pvm-reorder-list">
            {form.order.map((id, index) => {
              const item = byId[id];
              if (!item) return null;
              return (
                <li
                  key={id}
                  className={`pvm-reorder-row ${dragId === id ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); if (dragId && dragId !== id) move(dragId, index); setDragId(null); }}
                >
                  <GripVertical size={16} className="pvm-reorder-grip" aria-hidden="true" />
                  <span className="pvm-reorder-pos">{index + 1}</span>
                  <MediaThumb item={item} />
                  <span className="pvm-reorder-name">{item.caption || item.name}<small>{tagLabel(item)}</small></span>
                  <span className="pvm-reorder-moves">
                    <button type="button" onClick={() => move(id, index - 1)} disabled={index === 0} aria-label={`Move ${item.name} up`}><ArrowUp size={14} aria-hidden="true" /></button>
                    <button type="button" onClick={() => move(id, index + 1)} disabled={index === form.order.length - 1} aria-label={`Move ${item.name} down`}><ArrowDown size={14} aria-hidden="true" /></button>
                  </span>
                </li>
              );
            })}
          </ol>
        </ModalShell>
      ) : null}

      {lightboxItem ? (
        <Lightbox item={lightboxItem} items={lightboxItems} busy={busy} onClose={() => setLightboxId(null)} onNavigate={navigateLightbox} onSetCover={chooseCover} />
      ) : null}

    </div>
  );
}
