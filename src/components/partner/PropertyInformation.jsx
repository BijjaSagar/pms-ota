import { useParams, useSearchParams } from 'react-router-dom';
import {
  BedDouble, Building2, ClipboardList, Coffee, Gift, Image as ImageIcon,
  Landmark, Settings, Star,
} from 'lucide-react';
import {
  propertyInfoSectionById,
} from '../../lib/data/propertyInformationSections.js';
import { BasicInformationEditor } from './BasicInformationEditor.jsx';
import RoomsRateplansWorkspace from './RoomsRateplansWorkspace.jsx';
import AmenitiesRestaurantWorkspace from './AmenitiesRestaurantWorkspace.jsx';
import InclusionsPackagesWorkspace from './InclusionsPackagesWorkspace.jsx';
import PhotosVideosWorkspace from './PhotosVideosWorkspace.jsx';
import RulesPoliciesWorkspace from './RulesPoliciesWorkspace.jsx';
import ContentScoreDashboard from './ContentScoreDashboard.jsx';
import FinancialBankDetailsWorkspace from './FinancialBankDetailsWorkspace.jsx';
import PropertySettingsWorkspace from './PropertySettingsWorkspace.jsx';
import '../../styles/partner-property-information.css';
import '../../styles/partner-rooms-rateplans.css';
import '../../styles/partner-amenities-restaurant.css';
import '../../styles/partner-inclusions-packages.css';
import '../../styles/partner-photos-videos.css';
import '../../styles/partner-rules-policies.css';
import '../../styles/partner-content-score.css';
import '../../styles/partner-financial-bank-details.css';
import '../../styles/partner-property-settings.css';

const SECTION_ICONS = {
  'basic-information': Building2,
  'rooms-rateplans': BedDouble,
  'amenities-restaurants': Coffee,
  'inclusions-packages': Gift,
  'photos-videos': ImageIcon,
  'rules-policies': ClipboardList,
  'content-score': Star,
  'financial-bank-details': Landmark,
  settings: Settings,
};

const show = (value) => {
  if (value === undefined || value === null) return '—';
  const text = String(value).trim();
  return text || '—';
};

export function PropertyInformation({ property }) {
  const [params] = useSearchParams();
  const section = propertyInfoSectionById(params.get('section'));
  const Icon = SECTION_ICONS[section.id] ?? Building2;

  return (
    <div className="pii-page">
      <header className="pii-head">
        <div>
          <h1 className="pii-title">Property Information</h1>
          <p className="pii-sub">{show(property.propertyName)} · manage every part of this listing.</p>
        </div>
      </header>

      <section className="pii-content">
        <header className="pii-section-head">
          <span className="pii-section-icon"><Icon size={21} aria-hidden="true" /></span>
          <div>
            <h2>{section.label}</h2>
            <p>{section.description}</p>
          </div>
        </header>

        <div className="pii-section-body">
          {section.id === 'basic-information' ? <BasicInformationEditor property={property} /> : null}
          {section.id === 'rooms-rateplans' ? <RoomsRateplansWorkspace property={property} /> : null}
          {section.id === 'amenities-restaurants' ? <AmenitiesRestaurantWorkspace property={property} /> : null}
          {section.id === 'inclusions-packages' ? <InclusionsPackagesWorkspace property={property} /> : null}
          {section.id === 'photos-videos' ? <PhotosVideosWorkspace property={property} /> : null}
          {section.id === 'rules-policies' ? <RulesPoliciesWorkspace property={property} /> : null}
          {section.id === 'content-score' ? <ContentScoreDashboard property={property} /> : null}
          {section.id === 'financial-bank-details' ? <FinancialBankDetailsWorkspace property={property} /> : null}
          {section.id === 'settings' ? <PropertySettingsWorkspace property={property} /> : null}
        </div>
      </section>
    </div>
  );
}
