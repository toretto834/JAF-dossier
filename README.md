# JAF Dossier

Application locale de constitution et de préparation documentaire d’un dossier familial à remettre à un avocat. Elle organise les faits, les pièces, les allégations, les réponses et les demandes envisagées sans remplacer l’analyse juridique.

## Fonctionnalités disponibles

- création de plusieurs dossiers familiaux et enfants ;
- authentification locale avec mot de passe haché et verrouillage après échecs ;
- chronologie factuelle avec nature de la source, statut et éléments défavorables ;
- import sécurisé de PDF, DOCX, XLSX, images, TXT, CSV et EML ;
- originaux stockés hors du répertoire public, référence stable et SHA‑256 ;
- dates du document et d’import visibles pour chaque preuve, avec recherche par référence, nom, catégorie ou source ;
- modification des événements, métadonnées de preuves, allégations et demandes, tracée dans le journal d’audit ;
- tableau contradictoire des allégations et réponses ;
- demandes à discuter avec l’avocat reliées aux faits et aux preuves ;
- contrôle qualité explicable (faits sans preuve, demandes incomplètes, doublons, points à vérifier) ;
- vue de préparation du rendez-vous ;
- export ZIP versionné avec synthèse PDF/DOCX, dossier factuel PDF/DOCX, chronologie XLSX, tableau contradictoire XLSX, originaux, bordereau et manifeste ;
- journal d’audit des opérations sensibles ;
- navigation dédiée aux modules santé, activités, communications, pension, finances, coparentalité et décisions.

Les modules spécialisés utilisent actuellement le noyau commun des événements. La normalisation métier détaillée (calculs de pension, statistiques d’appels, décisions/obligations, attestations et analyse complète des dix critères JAF) constitue l’étape suivante.

## Démarrage avec PostgreSQL

Prérequis : Docker Desktop ou Docker Engine avec Compose.

1. Copier `.env.example` vers `.env`.
2. Définir `AUTH_SECRET` avec une valeur aléatoire d’au moins 32 caractères et `POSTGRES_PASSWORD` avec un mot de passe long et distinct. Compose refuse désormais de démarrer si l’une de ces valeurs est absente.
3. Démarrer :

```bash
docker compose up -d --build
```

4. Ouvrir [http://localhost:3000](http://localhost:3000). Au premier accès, l’application propose de créer le compte local initial.

PostgreSQL n’est pas publié sur la machine. L’application écoute uniquement sur `127.0.0.1:3000` par défaut.

## Variante mono-conteneur SQLite

```bash
docker compose -f docker-compose.sqlite.yml up -d --build
```

Cette variante conserve la base dans le volume `jaf_sqlite_data`. Elle convient à un usage local mono-utilisateur. Ne lancez pas simultanément les deux variantes sur le même port.

## Données persistantes

Dans le conteneur :

- `/app/data` : base SQLite éventuelle et pièces originales ;
- `/app/exports` : versions des dossiers générés ;
- volume PostgreSQL : données relationnelles dans la variante principale.

La suppression ou la recréation d’un conteneur ne supprime pas ces volumes. `docker compose down -v` les supprime définitivement : ne l’utilisez pas sans sauvegarde vérifiée.

## Sauvegarde et restauration

### PostgreSQL

Sauvegarder la base avec `pg_dump` depuis le service `db`, puis sauvegarder séparément les volumes `jaf_data` et `jaf_exports`. Les trois éléments doivent porter le même horodatage logique.

Pour restaurer sur une autre machine : créer les volumes, restaurer le dump PostgreSQL, recopier les volumes documentaires, puis lancer l’application. Contrôler ensuite quelques empreintes de pièces et générer un export de test.

### SQLite

Arrêter le conteneur pour obtenir une copie cohérente, puis sauvegarder ensemble les volumes `jaf_sqlite_data` et `jaf_sqlite_exports`. Chiffrer l’archive avec un outil local éprouvé et conserver la clé séparément.

Une sauvegarde n’est fiable qu’après un test de restauration. L’application ne fournit pas encore d’assistant de sauvegarde chiffrée intégré.

## Mise à jour

1. effectuer et tester une sauvegarde complète ;
2. récupérer la nouvelle version des sources ;
3. relancer `docker compose up -d --build` ;
4. contrôler le healthcheck et ouvrir un dossier existant ;
5. générer un petit export de contrôle.

Le point d’entrée applique actuellement le schéma Prisma via `prisma db push`. Avant un déploiement multiutilisateur, remplacez cette stratégie par des migrations SQL revues et versionnées.

## Développement local

```bash
npm install
npx prisma generate
npm run dev
```

Une base PostgreSQL correspondant à `DATABASE_URL` doit être disponible. Pour les tests unitaires :

```bash
npm test
```

Le build de production se vérifie avec `npm run build`.

Le dépôt contient `package-lock.json` et `pnpm-lock.yaml`. Les images Docker utilisent `npm ci` afin de reproduire exactement l’arbre de dépendances validé.

## Sécurité et limites

- L’usage prévu est local et mono-utilisateur. L’exposition sur un réseau, un hébergement tiers ou un fonctionnement multiutilisateur exige HTTPS, pare-feu, revue de sécurité, stratégie de migrations, sauvegardes chiffrées et analyse RGPD.
- Les originaux ne sont pas modifiés. Les téléchargements passent par une route authentifiée.
- Les formats actifs/exécutables et SVG sont refusés. La taille maximale par défaut est 25 Mo.
- Une empreinte SHA‑256 prouve seulement que le contenu n’a pas changé depuis l’import dans l’application.
- Les exports et contrôles ne déclarent jamais une preuve recevable ou irrecevable.
- L’IA documentaire n’est pas activée et aucun service cloud n’est requis.
- La suppression définitive, la restauration guidée, la rotation des sessions et l’antivirus documentaire restent à implémenter avant un usage exposé ou partagé.

## Avertissement

JAF Dossier prépare un ensemble documentaire de travail. Il ne fournit pas de conseil juridique, ne prédit pas une décision et ne transforme pas automatiquement un souhait en demande juridiquement fondée. Toute synthèse, question, pièce et demande doit être vérifiée avec l’avocat.
