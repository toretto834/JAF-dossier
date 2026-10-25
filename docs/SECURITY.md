# Sécurité et protection des données

## Périmètre actuel

La version actuelle est destinée à une machine locale, avec un seul propriétaire initial. Elle ne doit pas être exposée sur Internet ni utilisée comme service multiutilisateur sans revue complémentaire.

## Mesures implémentées

- écoute sur `127.0.0.1` uniquement ;
- PostgreSQL isolé sur un réseau Docker interne ;
- processus applicatif non-root ;
- mot de passe haché avec bcrypt, coût 12 ;
- blocage temporaire après cinq échecs de connexion ;
- session signée dans un cookie `HttpOnly`, `SameSite=Strict` ;
- contrôle d’origine sur les mutations ;
- autorisation serveur par propriétaire et dossier ;
- validation Zod des données ;
- fichiers hors de `public/` et noms de stockage aléatoires ;
- contrôle canonique contre les traversées de chemins ;
- types actifs et exécutables refusés, SVG compris ;
- taille maximale configurable ;
- en-têtes CSP, anti-framing, `nosniff` et politique de permissions ;
- neutralisation des formules lors des exports XLSX ;
- journal d’audit sans contenu sensible ;
- conservation des originaux et manifeste SHA‑256 ;
- audit npm des dépendances de production sans vulnérabilité connue au moment du build validé.

## Secrets obligatoires

Avant toute donnée réelle, créer `.env` depuis `.env.example` et définir :

- `AUTH_SECRET` : valeur aléatoire d’au moins 32 caractères ;
- `POSTGRES_PASSWORD` : mot de passe distinct et long ;
- `MAX_UPLOAD_MB` : limite adaptée au poste.

Ne jamais committer `.env`, une sauvegarde, un export ou un original.

## Menaces restant à traiter avant exposition réseau

- sessions opaques et révocables stockées en base ;
- rotation de session et expiration d’inactivité ;
- second facteur ou authentification système ;
- limitation de débit distribuée ;
- antivirus ou sandbox documentaire ;
- chiffrement applicatif de champs très sensibles ;
- sauvegarde/restauration chiffrée intégrée ;
- suppression logique et purge contrôlée ;
- supervision et politique de rétention des audits ;
- tests d’accès croisé multiutilisateur ;
- HTTPS, proxy durci, pare-feu et gestion des correctifs ;
- analyse RGPD et hébergement des données de mineurs.

## Signification du SHA‑256

L’empreinte permet de constater qu’un fichier exporté est identique au contenu importé. Elle ne prouve ni l’origine, ni la date réelle, ni l’authenticité, ni la recevabilité d’une pièce.

## Signalement

En cas de suspicion de fuite ou d’accès non autorisé : arrêter les conteneurs, isoler la machine du réseau, préserver une copie des journaux et volumes, changer les secrets depuis un poste sûr et demander un avis professionnel avant toute remise en service.

