import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT = 'contact@mapsdab.com';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function Privacy_FR() {
  return (
    <>
      <Section title="1. Responsable du traitement">
        <p>
          Le site <strong>MapsDab</strong> (mapsdab.com) est édité par ses créateurs.
          Pour toute question relative à vos données personnelles, contactez-nous à :{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p><strong>Sans compte :</strong></p>
        <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem' }}>
          <li>Aucune donnée personnelle n'est collectée pour la consultation de la carte.</li>
          <li>Pour les signalements : adresse IP transformée de manière irréversible (SHA-256 + sel) — l'IP brute n'est jamais stockée. Suppression automatique après 4 heures.</li>
          <li>Un identifiant de session anonyme (cookie technique) pour l'anti-spam signalements.</li>
        </ul>
        <p><strong>Avec un compte (facultatif) :</strong></p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Nom d'utilisateur, adresse e-mail, mot de passe chiffré (bcrypt).</li>
          <li>Ces données ne sont jamais vendues, cédées ou utilisées à des fins commerciales.</li>
        </ul>
      </Section>

      <Section title="3. Cookies">
        <p>MapsDab utilise les types de cookies suivants :</p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li><strong>Cookie technique (anti-spam)</strong> : identifiant de session anonyme, durée 4h. Nécessaire au fonctionnement du service.</li>
          <li><strong>Cookie d'authentification</strong> : JWT stocké localement si vous créez un compte. Nécessaire au fonctionnement du service.</li>
          <li><strong>Google Analytics</strong> : cookies de mesure d'audience (_ga, _gid). Permettent d'analyser l'utilisation du site de manière agrégée. Vous pouvez vous y opposer via les paramètres de votre navigateur ou l'extension <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Google Analytics Opt-out</a>.</li>
          <li><strong>Google AdSense</strong> (à venir) : cookies publicitaires pour afficher des annonces pertinentes. Un bandeau de consentement sera affiché pour les résidents européens.</li>
        </ul>
      </Section>

      <Section title="4. Google Analytics">
        <p>
          Ce site utilise Google Analytics 4, un service d'analyse d'audience fourni par Google LLC.
          Google Analytics collecte des informations sur votre utilisation du site (pages visitées, durée, appareil, localisation approximative par pays/région) de manière agrégée et anonymisée.
        </p>
        <p>
          Les données sont traitées par Google conformément à sa{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>politique de confidentialité</a>.
          L'anonymisation des IP est activée.
        </p>
      </Section>

      <Section title="5. Finalités du traitement">
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Fourniture du service de localisation de DABs</li>
          <li>Anti-spam pour les signalements communautaires</li>
          <li>Amélioration du service via les statistiques d'audience</li>
          <li>Gestion des comptes utilisateurs (facultatif)</li>
        </ul>
      </Section>

      <Section title="6. Durée de conservation">
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Données anti-spam (IP hachée) : <strong>4 heures</strong></li>
          <li>Données de compte : jusqu'à suppression du compte par l'utilisateur</li>
          <li>Données Google Analytics : <strong>14 mois</strong> (paramétrage par défaut GA4)</li>
        </ul>
      </Section>

      <Section title="7. Vos droits">
        <p>
          Conformément à la loi algérienne n° 18-07 du 10 juin 2018, vous disposez des droits suivants :
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Droit d'accès à vos données personnelles</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement (suppression de compte)</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à :{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>

      <Section title="8. Sécurité">
        <p>
          MapsDab met en œuvre des mesures techniques adaptées pour protéger vos données :
          chiffrement HTTPS (TLS), mots de passe hachés (bcrypt 12 rounds), tokens JWT sécurisés,
          requêtes SQL paramétrées, limitation de débit (rate limiting).
        </p>
      </Section>

      <Section title="9. Modification de la politique">
        <p>
          Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut de page.
          En continuant à utiliser MapsDab après une modification, vous acceptez la nouvelle politique.
        </p>
      </Section>
    </>
  );
}

function Privacy_EN() {
  return (
    <>
      <Section title="1. Data Controller">
        <p>
          The website <strong>MapsDab</strong> (mapsdab.com) is operated by its creators.
          For any questions regarding your personal data, contact us at:{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>

      <Section title="2. Data Collected">
        <p><strong>Without an account:</strong></p>
        <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem' }}>
          <li>No personal data is collected for browsing the map.</li>
          <li>For reports: IP address is irreversibly transformed (SHA-256 + salt) — the raw IP is never stored. Automatically deleted after 4 hours.</li>
          <li>An anonymous session identifier (technical cookie) for report anti-spam.</li>
        </ul>
        <p><strong>With an account (optional):</strong></p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Username, email address, encrypted password (bcrypt).</li>
          <li>This data is never sold, transferred, or used for commercial purposes.</li>
        </ul>
      </Section>

      <Section title="3. Cookies">
        <p>MapsDab uses the following types of cookies:</p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li><strong>Technical cookie (anti-spam)</strong>: anonymous session ID, 4h duration. Required for service operation.</li>
          <li><strong>Authentication cookie</strong>: JWT stored locally if you create an account. Required for service operation.</li>
          <li><strong>Google Analytics</strong>: audience measurement cookies (_ga, _gid). Used to analyze site usage in aggregate. You can opt out via your browser settings or the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Google Analytics Opt-out</a> extension.</li>
          <li><strong>Google AdSense</strong> (upcoming): advertising cookies to display relevant ads. A consent banner will be shown for European residents.</li>
        </ul>
      </Section>

      <Section title="4. Google Analytics">
        <p>
          This site uses Google Analytics 4, an audience analysis service provided by Google LLC.
          Google Analytics collects information about your use of the site (pages visited, duration, device, approximate location by country/region) in an aggregated and anonymized manner.
        </p>
        <p>
          Data is processed by Google in accordance with its{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>privacy policy</a>.
          IP anonymization is enabled.
        </p>
      </Section>

      <Section title="5. Processing Purposes">
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Providing the ATM location service</li>
          <li>Anti-spam for community reports</li>
          <li>Service improvement through audience statistics</li>
          <li>User account management (optional)</li>
        </ul>
      </Section>

      <Section title="6. Retention Period">
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Anti-spam data (hashed IP): <strong>4 hours</strong></li>
          <li>Account data: until account deletion by the user</li>
          <li>Google Analytics data: <strong>14 months</strong> (GA4 default)</li>
        </ul>
      </Section>

      <Section title="7. Your Rights">
        <p>
          Under Algerian Law No. 18-07 of June 10, 2018, you have the following rights:
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Right of access to your personal data</li>
          <li>Right of rectification</li>
          <li>Right to erasure (account deletion)</li>
          <li>Right to object to processing</li>
        </ul>
        <p>
          To exercise these rights, contact us at:{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          MapsDab implements appropriate technical measures to protect your data:
          HTTPS encryption (TLS), hashed passwords (bcrypt 12 rounds), secure JWT tokens,
          parameterized SQL queries, rate limiting.
        </p>
      </Section>

      <Section title="9. Policy Updates">
        <p>
          This policy may be updated. The last modification date is shown at the top of the page.
          By continuing to use MapsDab after an update, you accept the revised policy.
        </p>
      </Section>
    </>
  );
}

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const isFR = i18n.language === 'fr';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
          ← {isFR ? 'Retour' : 'Back'}
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>
          {isFR ? 'Politique de confidentialité' : 'Privacy Policy'}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          {isFR ? 'Dernière mise à jour : 7 mai 2026' : 'Last updated: May 7, 2026'}
        </p>
      </div>

      {isFR ? <Privacy_FR /> : <Privacy_EN />}
    </div>
  );
}
