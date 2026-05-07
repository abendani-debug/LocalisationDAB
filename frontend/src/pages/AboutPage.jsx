import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT = 'contact@mapsdab.com';

export default function AboutPage() {
  const { i18n } = useTranslation();
  const isFR = i18n.language === 'fr';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: 'system-ui, sans-serif', color: '#1f2937', lineHeight: 1.7 }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
          ← {isFR ? 'Retour' : 'Back'}
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>
          {isFR ? 'À propos de MapsDab' : 'About MapsDab'}
        </h1>
      </div>

      {isFR ? (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#374151' }}>
              <strong>MapsDab</strong> est une application web gratuite et communautaire qui vous aide à
              trouver un distributeur automatique de billets (DAB) près de chez vous en Algérie,
              et à connaître son état en temps réel.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Pourquoi MapsDab ?
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              Trouver un DAB fonctionnel et approvisionné en Algérie peut être une vraie difficulté.
              MapsDab répond à ce problème du quotidien en combinant la localisation GPS et les signalements
              anonymes de la communauté pour indiquer en temps réel si un DAB est disponible, vide ou en panne.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Fonctionnalités
            </h2>
            <ul style={{ fontSize: '0.88rem', color: '#374151', paddingLeft: '1.25rem' }}>
              <li>Carte interactive avec plus de <strong>1 100 DABs</strong> référencés à travers l'Algérie</li>
              <li>État communautaire en temps réel : disponible, vide, en panne</li>
              <li>Signalement anonyme — aucun compte requis</li>
              <li>Filtrage par banque et statut</li>
              <li>Proposition de nouveaux DABs par la communauté</li>
              <li>Disponible en français et en anglais</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Gratuit et communautaire
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              MapsDab est entièrement gratuit. Il repose sur la participation de la communauté :
              chaque signalement aide les autres utilisateurs à gagner du temps. Plus vous signalez,
              plus l'information est fiable pour tout le monde.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Technologies utilisées
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              MapsDab est construit avec des technologies modernes et open source :
              React, Node.js, PostgreSQL, Leaflet.js et OpenStreetMap.
              Les données sur les DABs sont enrichies via Google Places API.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Contact
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              Une question, une suggestion, un DAB manquant ?{' '}
              <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
            </p>
          </section>
        </>
      ) : (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#374151' }}>
              <strong>MapsDab</strong> is a free, community-powered web application that helps you
              find an ATM (Automated Teller Machine) near you in Algeria and check its real-time status.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Why MapsDab?
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              Finding a working, stocked ATM in Algeria can be a real challenge.
              MapsDab addresses this everyday problem by combining GPS location with anonymous
              community reports to show in real time whether an ATM is available, empty, or out of order.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Features
            </h2>
            <ul style={{ fontSize: '0.88rem', color: '#374151', paddingLeft: '1.25rem' }}>
              <li>Interactive map with over <strong>1,100 ATMs</strong> across Algeria</li>
              <li>Real-time community status: available, empty, out of order</li>
              <li>Anonymous reporting — no account required</li>
              <li>Filter by bank and status</li>
              <li>Community ATM proposals</li>
              <li>Available in French and English</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Free and Community-Driven
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              MapsDab is completely free. It relies on community participation:
              every report helps other users save time. The more people report, the more
              reliable the information is for everyone.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Technologies
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              MapsDab is built with modern open-source technologies:
              React, Node.js, PostgreSQL, Leaflet.js and OpenStreetMap.
              ATM data is enriched via the Google Places API.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.6rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3rem' }}>
              Contact
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#374151' }}>
              A question, a suggestion, a missing ATM?{' '}
              <a href={`mailto:${CONTACT}`} style={{ color: '#2563eb' }}>{CONTACT}</a>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
