import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LAST_UPDATE_FR = '7 mai 2026';
const LAST_UPDATE_EN = 'May 7, 2026';
const APP_NAME       = 'MapsDab';
const CONTACT        = 'contact@mapsdab.com';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.88rem', color: '#374151' }}>
        {children}
      </div>
    </section>
  );
}

function CGU_FR() {
  return (
    <>
      <Section title="1. Présentation de l'application">
        <p>
          <strong>{APP_NAME}</strong> est une application web gratuite permettant de localiser les
          distributeurs automatiques de billets (DAB) en Algérie et de consulter leur état en temps réel
          grâce aux signalements de la communauté.
        </p>
        <p>
          L'accès à l'application est libre et gratuit. Aucune inscription n'est requise pour consulter
          la carte ou signaler l'état d'un DAB.
        </p>
      </Section>

      <Section title="2. Signalements anonymes">
        <p>
          Le système de signalement (état d'un DAB : disponible, vide, en panne) est <strong>entièrement
          anonyme</strong>. Aucune donnée permettant d'identifier personnellement un utilisateur n'est
          collectée ou conservée lors d'un signalement.
        </p>
        <p>À des fins de lutte contre les abus (anti-spam), un mécanisme technique est mis en place :</p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>L'adresse IP est <strong>transformée de manière irréversible</strong> (hachage SHA-256 avec sel) avant tout traitement. L'adresse IP brute n'est jamais stockée.</li>
          <li>Un identifiant de session temporaire (cookie) est utilisé localement pour limiter les signalements répétés sur un même DAB.</li>
          <li>Ces données techniques sont automatiquement supprimées au bout de <strong>4 heures</strong>.</li>
        </ul>
      </Section>

      <Section title="3. Création de compte">
        <p>
          La création d'un compte utilisateur est facultative. Elle permet de laisser des avis sur les DABs.
          Les informations collectées lors de l'inscription sont :
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Un nom d'utilisateur</li>
          <li>Une adresse e-mail</li>
          <li>Un mot de passe (stocké sous forme chiffrée, jamais en clair)</li>
        </ul>
        <p>
          Ces données sont utilisées <strong>exclusivement</strong> pour le fonctionnement de l'application.
          Elles ne font l'objet d'<strong>aucune cession, vente, location ou utilisation commerciale</strong>,
          quelle qu'en soit la forme.
        </p>
      </Section>

      <Section title="4. Absence de traçage et de publicité">
        <p>
          {APP_NAME} ne collecte aucune donnée à des fins publicitaires ou de profilage.
          Aucun cookie de traçage tiers, aucune régie publicitaire et aucun outil d'analyse
          comportementale ne sont intégrés à l'application.
        </p>
      </Section>

      <Section title="5. Données cartographiques">
        <p>
          Les données cartographiques sont fournies par <strong>OpenStreetMap</strong> (licence ODbL)
          et <strong>Google Maps</strong>. Les informations sur les DABs proviennent de sources publiques
          et des contributions de la communauté. L'exactitude des informations affichées ne peut être
          garantie à tout moment.
        </p>
      </Section>

      <Section title="6. Responsabilité">
        <p>
          Les signalements sont fournis par les utilisateurs à titre indicatif. {APP_NAME} ne garantit pas
          l'état réel des DABs affichés et ne saurait être tenu responsable en cas d'information inexacte
          ou obsolète.
        </p>
        <p>L'utilisation de l'application se fait sous la seule responsabilité de l'utilisateur.</p>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <p>
          L'ensemble des éléments constituant l'application (code, design, logo) est la propriété exclusive
          de ses créateurs. Toute reproduction ou utilisation sans autorisation préalable est interdite.
        </p>
        <p>
          Les logos des banques affichés sur la carte sont la propriété de leurs institutions respectives
          et sont utilisés à titre informatif uniquement.
        </p>
      </Section>

      <Section title="8. Droit applicable">
        <p>
          Les présentes conditions sont régies par le droit algérien, notamment la loi n° 18-07 du
          10 juin 2018 relative à la protection des personnes physiques dans le traitement des données
          à caractère personnel.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Pour toute question relative aux présentes CGU ou à vos données personnelles, vous pouvez
          nous contacter à l'adresse suivante :{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>
    </>
  );
}

function CGU_EN() {
  return (
    <>
      <Section title="1. About the Application">
        <p>
          <strong>{APP_NAME}</strong> is a free web application that allows users to locate ATMs
          (Automated Teller Machines) across Algeria and check their real-time status through
          community reports.
        </p>
        <p>
          Access to the application is free and unrestricted. No account is required to browse
          the map or report the status of an ATM.
        </p>
      </Section>

      <Section title="2. Anonymous Reporting">
        <p>
          The reporting system (ATM status: available, empty, out of order) is <strong>entirely
          anonymous</strong>. No personally identifiable information is collected or stored when
          a report is submitted.
        </p>
        <p>To prevent abuse (anti-spam), a technical mechanism is in place:</p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>IP addresses are <strong>irreversibly transformed</strong> (SHA-256 hashing with salt) before any processing. Raw IP addresses are never stored.</li>
          <li>A temporary session identifier (cookie) is used locally to limit repeated reports on the same ATM.</li>
          <li>This technical data is automatically deleted after <strong>4 hours</strong>.</li>
        </ul>
      </Section>

      <Section title="3. Account Creation">
        <p>
          Creating a user account is optional. It allows users to leave reviews on ATMs.
          The information collected at registration is:
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>A username</li>
          <li>An email address</li>
          <li>A password (stored in encrypted form, never in plain text)</li>
        </ul>
        <p>
          This data is used <strong>exclusively</strong> for the operation of the application.
          It is <strong>never sold, rented, shared, or used for any commercial purpose</strong>
          of any kind.
        </p>
      </Section>

      <Section title="4. No Tracking or Advertising">
        <p>
          {APP_NAME} does not collect any data for advertising or profiling purposes.
          No third-party tracking cookies, advertising networks, or behavioral analytics
          tools are integrated into the application.
        </p>
      </Section>

      <Section title="5. Map Data">
        <p>
          Map data is provided by <strong>OpenStreetMap</strong> (ODbL license) and{' '}
          <strong>Google Maps</strong>. ATM information comes from public sources and community
          contributions. The accuracy of displayed information cannot be guaranteed at all times.
        </p>
      </Section>

      <Section title="6. Liability">
        <p>
          Reports are provided by users for informational purposes only. {APP_NAME} does not
          guarantee the actual status of displayed ATMs and cannot be held responsible for
          inaccurate or outdated information.
        </p>
        <p>Use of the application is at the sole responsibility of the user.</p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          All elements of the application (code, design, logo) are the exclusive property of
          their creators. Any reproduction or use without prior authorization is prohibited.
        </p>
        <p>
          Bank logos displayed on the map are the property of their respective institutions
          and are used for informational purposes only.
        </p>
      </Section>

      <Section title="8. Applicable Law">
        <p>
          These terms are governed by Algerian law, in particular Law No. 18-07 of June 10, 2018
          on the protection of individuals with regard to the processing of personal data.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For any questions regarding these Terms of Use or your personal data, please contact
          us at:{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>
    </>
  );
}

export default function CGUPage() {
  const { i18n } = useTranslation();
  const isFR = i18n.language === 'fr';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>

      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
          ← {isFR ? 'Retour' : 'Back'}
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>
          {isFR ? "Conditions Générales d'Utilisation" : 'Terms of Use'}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          {isFR ? `Dernière mise à jour : ${LAST_UPDATE_FR}` : `Last updated: ${LAST_UPDATE_EN}`}
        </p>
      </div>

      {isFR ? <CGU_FR /> : <CGU_EN />}

    </div>
  );
}
