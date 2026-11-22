import { SignIn, UserProfile } from '@clerk/react'
import { Link } from '@tanstack/react-router'
import { AppIcon, Mark } from '../components/Mark.tsx'
import { useMessages } from '../i18n/locale-context.tsx'
import { appIds, apps } from '../portal/apps.ts'

export function SignInScreen({ redirect }: { redirect: string }) {
  const t = useMessages().signIn
  return (
    <div className="signin">
      <div className="signin-intro">
        <Mark size={56} />
        <h1 className="h1">{t.title}</h1>
        <p className="lead">{t.lead}</p>
        <div className="signin-icons">
          {appIds.map((id) => (
            <AppIcon key={id} src={apps[id].icon} size={40} />
          ))}
        </div>
      </div>
      <div className="signin-card">
        {/* Accounts are made in the apps: no sign-up route and no sign-up link. */}
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl={redirect}
          fallback={
            <div className="card" style={{ width: '100%', minHeight: 420 }} />
          }
        />
        <p className="signin-note">{t.note}</p>
      </div>
    </div>
  )
}

export function ProfileScreen({
  path,
  signOut,
}: {
  path: string
  signOut: () => void
}) {
  const t = useMessages()
  return (
    <>
      <div className="intro">
        <h1 className="h1">{t.profile.title}</h1>
        <p className="lead">{t.profile.lead}</p>
      </div>
      <div className="card profile-card">
        <UserProfile
          routing="path"
          path={path}
          appearance={{ elements: { cardBox: 'cl-ae-flat' } }}
          // API keys are a Clerk feature the apps do not use.
          apiKeysProps={{ hide: true }}
        />
      </div>
      <button
        type="button"
        className="btn btn-quiet btn-small"
        style={{ alignSelf: 'flex-start' }}
        onClick={signOut}
      >
        {t.shell.signOut}
      </button>
    </>
  )
}

export function NotFoundScreen() {
  const t = useMessages().notFound
  return (
    <div className="notfound">
      <p className="dot-eyebrow">404</p>
      <h1 className="h1">{t.title}</h1>
      <p className="muted" style={{ margin: 0 }}>
        {t.body}
      </p>
      <Link to="/" className="btn btn-primary">
        {t.cta}
      </Link>
    </div>
  )
}
