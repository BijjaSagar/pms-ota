import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CoTravellersSection } from '../components/profile/CoTravellersSection'
import { LoggedInDevicesSection } from '../components/profile/LoggedInDevicesSection'
import { MyProfileSection } from '../components/profile/MyProfileSection'
import { ProfileNav } from '../components/profile/ProfileNav'
import type { ProfileSection } from '../components/profile/ProfileNav'
import { ResetPasswordSection } from '../components/profile/ResetPasswordSection'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { initialCoTravellers, initialDevices, sampleProfile } from '../data/profile'
import type { CoTraveller, ProfileDocument, UserProfile } from '../types'

function initials(profile: UserProfile) {
  return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || 'AM'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile')
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...sampleProfile,
    document: { ...sampleProfile.document },
  }))
  const [travellers, setTravellers] = useState<CoTraveller[]>(initialCoTravellers)
  const [devices] = useState(initialDevices)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const photoUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    }
  }, [])

  const updateProfile = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  const updateDocument = <K extends keyof ProfileDocument>(key: K, value: string) => {
    setProfile((current) => ({
      ...current,
      document: { ...current.document, [key]: value },
    }))
  }

  const handlePhotoChange = (file: File) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    const url = URL.createObjectURL(file)
    photoUrlRef.current = url
    updateProfile('photoUrl', url)
  }

  const saveTraveller = (traveller: CoTraveller) => {
    setTravellers((current) => {
      const exists = current.some((item) => item.id === traveller.id)
      return exists
        ? current.map((item) => (item.id === traveller.id ? traveller : item))
        : [...current, traveller]
    })
  }

  const removeTraveller = (id: string) => {
    setTravellers((current) => current.filter((item) => item.id !== id))
  }

  const confirmLogout = () => {
    setLogoutOpen(false)
    navigate('/')
  }

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent/60" />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">
              Your account
            </p>
          </div>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            My profile
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            Manage your personal details, the people you travel with, and the devices signed in to
            your account.
          </p>
        </div>
      </section>

      <div className="container-page mt-8 lg:mt-10">
        <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt=""
                    className="size-14 rounded-full border border-line object-cover"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft font-display text-xl text-brand">
                    {initials(profile)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-xl leading-tight text-ink">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="truncate text-xs text-muted">{profile.email}</p>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Aurelia member
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-white p-2">
              <ProfileNav
                active={activeSection}
                onChange={setActiveSection}
                onLogout={() => setLogoutOpen(true)}
              />
            </div>
          </aside>

          <div key={activeSection} className="min-w-0 animate-fade-up">
            {activeSection === 'profile' ? (
              <MyProfileSection
                profile={profile}
                onChange={updateProfile}
                onDocumentChange={updateDocument}
                onPhotoChange={handlePhotoChange}
              />
            ) : null}

            {activeSection === 'travellers' ? (
              <CoTravellersSection
                travellers={travellers}
                onSave={saveTraveller}
                onRemove={removeTraveller}
              />
            ) : null}

            {activeSection === 'devices' ? <LoggedInDevicesSection devices={devices} /> : null}

            {activeSection === 'password' ? (
              <ResetPasswordSection registeredEmail={profile.email} />
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out?"
        description="Are you sure you want to logout? You will need to sign in again to manage your bookings."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setLogoutOpen(false)}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={confirmLogout}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Log out
          </button>
        </div>
      </Modal>
    </div>
  )
}
