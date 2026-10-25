# Architecture technique

## Vue d’ensemble

JAF Dossier est une application Next.js 15 exécutée localement. Le navigateur communique uniquement avec l’API Next.js ; PostgreSQL et le stockage documentaire ne sont jamais exposés directement.

```text
Navigateur local
      │ HTTP 127.0.0.1:3000
      ▼
Next.js / React / API
      ├── Prisma ──► PostgreSQL
      ├── /app/data ──► originaux immuables
      └── /app/exports ──► ZIP avocat versionnés
```

Le service applicatif est connecté à deux réseaux Docker :

- `jaf_front` permet uniquement la publication du port de l’application sur `127.0.0.1` ;
- `jaf_internal` relie l’application à PostgreSQL, sans publication du port 5432.

## Composants

| Composant | Responsabilité |
|---|---|
| `app/` | Pages Next.js, API HTTP et healthcheck |
| `components/` | Interface de connexion et espace de travail |
| `lib/auth.ts` | Cookie de session signé, utilisateur courant et autorisations |
| `lib/storage.ts` | Écriture hors du répertoire public et contrôle des chemins |
| `lib/exporter.ts` | Production PDF, DOCX, XLSX, ZIP et manifeste |
| `lib/db.ts` | Client Prisma partagé |
| `prisma/` | Schémas PostgreSQL et SQLite |
| `Dockerfile*` | Images multi-stage, processus non-root |

## Parcours d’une preuve

1. L’utilisateur envoie un fichier via une route authentifiée.
2. L’API limite la taille et compare le type autorisé à la signature détectée.
3. Le nom de stockage est généré côté serveur ; le nom original reste une métadonnée.
4. Le fichier est écrit dans `/app/data/originals/<dossier>/` avec des permissions restrictives.
5. Une empreinte SHA‑256 et une référence `Pxxx` sont enregistrées.
6. Les liens vers événements, demandes et allégations sont conservés en tables de jointure.
7. Le téléchargement repasse par une vérification d’appartenance au dossier.

## Parcours d’un export

L’API charge une vue cohérente du dossier, génère les documents de travail, recopie les originaux sous leurs références, crée le manifeste, calcule l’empreinte du ZIP puis enregistre une version d’export. Une nouvelle génération ne remplace jamais la précédente.

## Choix de conception

- noyau relationnel strict pour les dossiers, faits, pièces, demandes et liens ;
- données secondaires extensibles via `moduleData` sur les événements ;
- dates stockées en UTC et affichées en français ;
- aucune dépendance obligatoire à un service cloud ;
- aucune IA active par défaut ;
- séparation explicite entre fait, source, interprétation et point juridique à vérifier.

## Variante SQLite

`docker-compose.sqlite.yml` utilise `prisma/schema.sqlite.prisma` et un seul conteneur. Elle vise l’usage local mono-utilisateur. Les deux schémas exposent le même modèle logique afin que le code applicatif reste commun.

