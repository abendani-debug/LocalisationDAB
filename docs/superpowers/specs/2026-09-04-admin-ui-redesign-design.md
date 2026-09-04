# Refonte UI/UX de l'admin (pilote) — Design

## Objectif

Amener l'interface admin de LocalisationDAB aux normes actuelles des dashboards SaaS
(navigation par sidebar, densité d'information maîtrisée, hiérarchie visuelle claire),
tout en restant fidèle à l'identité de marque MapsDab (teal, corail, vert du logo)
plutôt que d'adopter une palette générique.

**Portée** : pilote sur 2 pages (`AdminDashboard`, `AdminStatsBanques`) + le shell de
navigation (sidebar + header) qui s'applique à **toutes** les routes `/admin/*`. Les
6 autres pages admin (`AdminDABList`, `AdminDABForm`, `AdminSignalements`,
`AdminPropositions`, `AdminPays`, `AdminEmbedTokens`) migrent dans le nouveau shell
mais gardent leur style Tailwind interne actuel — leur refonte visuelle est un chantier
séparé, ultérieur.

## Pourquoi une sidebar plutôt que le Navbar public actuel

Aujourd'hui, `Navbar.jsx` est partagé entre le site public et l'admin : logo + switch
langue + menu hamburger contenant à la fois des liens admin, des liens d'auth publique
(login/register) et des liens légaux (CGU, confidentialité). C'est le pattern d'un site
vitrine, pas d'un outil de gestion utilisé quotidiennement par l'équipe MapsDab. Les
dashboards SaaS actuels (Stripe, Linear, Vercel) exposent systématiquement une
navigation latérale persistante listant les sections de l'outil — c'est ce que
l'utilisateur a validé comme direction pendant le brainstorm visuel.

## Architecture

### Séparation shell public / shell admin

`App.jsx` détecte déjà les routes `/embed/*` pour leur donner un shell différent
(sans Navbar ni splash). On applique le même principe aux routes `/admin/*` : au lieu
de rendre `<Navbar />` puis `<AppRoutes />` pour tout, `AppRoutes` doit distinguer les
routes admin et les envelopper dans `AdminLayout` au lieu du `Navbar` public.

```
App()
 ├── isEmbed → EmbedPage / EmbedStatsPage (shell minimal, existant)
 └── sinon → AppRoutes()
      ├── route /admin/* → <AdminLayout><PageAdmin /></AdminLayout>
      └── autres routes  → <Navbar /> + page publique (comportement actuel inchangé)
```

`AdminLayout` est un nouveau composant dans `frontend/src/components/admin/` qui
rend la sidebar + un header de page, puis les `children` (la page admin courante) dans
la zone de contenu.

### Nouveaux composants

| Fichier | Rôle |
|---|---|
| `frontend/src/components/admin/AdminLayout.jsx` | Wrapper : sidebar + header + zone de contenu |
| `frontend/src/components/admin/AdminSidebar.jsx` | Navigation latérale (7 liens + badge propositions) |

### Composants modifiés

| Fichier | Changement |
|---|---|
| `frontend/src/App.jsx` | Toutes les routes `/admin/*` enveloppées dans `AdminLayout` au lieu du `Navbar` public |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Contenu redessiné : cartes KPI au lieu des boutons-actions actuels |
| `frontend/src/pages/admin/AdminStatsBanques.jsx` | Réhabillage visuel (couleurs/cartes) — la logique (dropdown, drill-down, ventilation par état) ne change pas |

Les 6 autres pages admin ne sont **pas modifiées** dans ce chantier — elles héritent
du nouveau shell automatiquement via `App.jsx`, sans changement de leur propre code.

## Sidebar

- Logo compact (pin + "Map's Dab") en haut
- 7 liens : Dashboard, Distributeurs, Signalements, Propositions (badge corail si
  `nbPropositions > 0`, réutilise la donnée déjà chargée par `AdminDashboard`), Pays,
  Widgets Embed, Stats Banques
- État actif détecté via `useLocation()` (route courante) — fond teal vif, texte blanc
- Bloc utilisateur en bas : initiale du nom dans un rond, nom, accès déconnexion
- Desktop (≥768px) : fixe, toujours visible. Mobile (<768px) : masquée par défaut,
  ouverte via un bouton hamburger dans le header, en tiroir par-dessus le contenu

## Header admin

Remplace le `Navbar` pour les routes admin :
- Titre de la page courante (statique par page, ex. "Dashboard", "Stats de signalement
  par banque")
- Switch langue FR/EN (même logique que `Navbar.jsx`, réutilisée)
- Menu utilisateur : nom + bouton déconnexion (réutilise `useAuth().logout`)

Pas de liens login/register/CGU/confidentialité dans ce header — ces liens restent
uniquement sur le site public. Un admin qui veut voir le site public clique sur le logo
(retour à `/`).

## Système visuel

### Couleurs (variables à définir, pas de fichier de tokens existant — on les inline
en constantes Tailwind arbitraires ou classes utilitaires, cohérent avec le reste du
projet qui n'a pas de config de thème centralisée)

| Rôle | Couleur | Usage |
|---|---|---|
| Sidebar / fond sombre | `#0b3b36` | Fond de la sidebar |
| Accent primaire | `#14b8a6` (teal-500) | Item de nav actif, boutons d'action primaires |
| Accent alerte | `#e35d43` (corail du logo) | Badge propositions en attente uniquement — pas décoratif |
| Fond de page | `#f7faf9` | Fond de la zone de contenu |
| Bordures cartes | `#e5eeec` | Cartes KPI, tableaux |
| Texte titre | `#0b3b36` | Titres de page |

Couleurs choisies directement depuis `frontend/public/logo.png` (teal du texte, corail
du pin) plutôt qu'une palette SaaS générique — validé pendant le brainstorm visuel.

### Typographie

Police système neutre (`system-ui` / stack Tailwind par défaut) conservée pour le
corps et les données — un dashboard admin gagne en usabilité à rester lisible et
prévisible plutôt que distinctif. Pas de police display séparée : la hiérarchie vient
du poids (700/800) et de la taille, pas du choix de fonte.

### Cartes KPI

Remplacent les boutons-actions actuels du haut de `AdminDashboard.jsx`. Format :
label discret en majuscules (`text-xs uppercase text-slate-400`), valeur en gros/gras
en dessous. Les actions qui étaient des boutons (import Google Places, liens vers les
sous-pages) migrent : les liens de navigation disparaissent du corps de la page
(remplacés par la sidebar), le bouton d'action "Import Google Places" reste comme
bouton dans le contenu de la page (ce n'est pas une navigation, c'est une action).

## Responsive

- `AdminLayout` : sidebar en `position: fixed` sur desktop, cachée + tiroir togglable
  sur mobile (classe Tailwind `md:` comme seuil, cohérent avec le reste du projet)
- Les grilles de cartes KPI passent de 4 colonnes (desktop) à 2 (tablette) à 1 (mobile)

## Tests

Pas de framework de test frontend dans ce projet (déjà le cas actuellement — décision
déjà actée, pas remise en question ici). Vérification :
1. `npm run build` doit passer sans erreur
2. Vérification manuelle en navigateur : Dashboard et Stats Banques dans le nouveau
   shell, navigation sidebar fonctionnelle vers les 6 autres pages (elles doivent
   s'afficher normalement, juste avec le nouveau shell autour), déconnexion
   fonctionnelle, switch langue fonctionnel, comportement responsive (réduire la
   fenêtre pour vérifier le tiroir mobile)

## Hors scope

- Redesign visuel du contenu des 6 pages admin restantes (chantier futur séparé)
- Mode sombre (écarté pendant le brainstorm — un seul thème clair)
- Fichier de design tokens centralisé (CSS variables) — pas nécessaire pour un
  pilote sur 2 pages, à envisager si la refonte s'étend à tout l'admin plus tard
- Modification du `Navbar.jsx` public (reste inchangé pour le site public)
