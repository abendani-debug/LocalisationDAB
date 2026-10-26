export default function PrivacyPolicyMobilePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', lineHeight: 1.6 }}>
      <h1>Politique de confidentialité — MapsDab</h1>
      <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <h2>Données collectées</h2>
      <p>
        MapsDab utilise votre position géographique pour afficher les distributeurs
        automatiques de billets (DAB) à proximité et pour détecter automatiquement
        quand vous approchez d'un DAB dont l'état n'a pas été signalé récemment,
        y compris lorsque l'application est en arrière-plan.
      </p>

      <h2>Pourquoi la localisation en arrière-plan</h2>
      <p>
        Cette fonctionnalité (désactivable à tout moment dans les réglages de votre
        téléphone) permet de vous envoyer une notification locale uniquement quand
        vous êtes physiquement à moins de 50 mètres d'un DAB sans signalement récent,
        pour vous inviter à indiquer son état à la communauté. Votre position n'est
        JAMAIS transmise à nos serveurs en continu : seule une requête ponctuelle est
        faite pour vérifier si ce DAB précis a déjà été signalé, au moment où vous
        entrez dans la zone.
      </p>

      <h2>Anonymat des signalements</h2>
      <p>
        Les signalements d'état de DAB sont anonymes : aucun compte n'est nécessaire.
        L'adresse IP utilisée pour limiter les abus est hachée (SHA-256 salé) et n'est
        jamais stockée en clair ni associée à votre position précise.
      </p>

      <h2>Données partagées avec des tiers</h2>
      <p>Aucune. Vos données de localisation ne sont ni vendues ni partagées.</p>

      <h2>Contact</h2>
      <p>Pour toute question : contact@mapsdab.com</p>
    </div>
  );
}
