import { Link } from 'react-router-dom';

const LAST_UPDATE = '3 mai 2026';
const APP_NAME    = 'localiseMyDab';
const CONTACT     = 'contact@localizemaydab.com';

export default function CGUPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>

      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Retour</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Dernière mise à jour : {LAST_UPDATE}</p>
      </div>

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
        <p>
          À des fins de lutte contre les abus (anti-spam), un mécanisme technique est mis en place :
        </p>
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
        <p>
          L'utilisation de l'application se fait sous la seule responsabilité de l'utilisateur.
        </p>
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
          nous contacter à l'adresse suivante : <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
        </p>
      </Section>

    </div>
  );
}

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
