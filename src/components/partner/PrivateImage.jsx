// An image only the signed-in partner may see (the API needs the bearer token, so a plain <img src> can't load it).
import { Image as ImageIcon } from 'lucide-react';
import { usePrivateUrl } from '../../lib/api/properties.js';

export function PrivateImage({ path, alt, className = '' }) {
  const { url, failed } = usePrivateUrl(path);
  if (url) return <img src={url} alt={alt} className={className} />;
  return (
    <div className={`pi-photo-file-only ${className}`}>
      <ImageIcon size={24} aria-hidden="true" />
      <small>{failed ? 'Preview unavailable' : 'Loading…'}</small>
    </div>
  );
}
