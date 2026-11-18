// Renders the shared Modal into document.body so it isn't trapped inside the
// animated page container (transforms there create a containing block / stacking context).
import { createPortal } from 'react-dom';
import { Modal } from '../Layout.jsx';

export function PortalModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<Modal {...props} />, document.body);
}
