# Exploitation Docker

## Installation PostgreSQL

```powershell
Copy-Item .env.example .env
# Modifier ensuite les secrets dans .env
docker compose up -d --build
docker compose ps
```

L’application est accessible sur `http://localhost:3000`.

## Installation SQLite

```powershell
docker compose -f docker-compose.sqlite.yml up -d --build
```

Cette variante ne doit pas être lancée en même temps que la variante PostgreSQL sur le même port.

## Commandes courantes

```powershell
docker compose ps
docker compose logs --tail 100 app
docker compose restart app
docker compose pull
docker compose up -d --build
docker compose down
```

`docker compose down` conserve les volumes. L’option `-v` les détruit et ne doit être utilisée qu’après vérification précise de la cible et d’une sauvegarde restaurable.

## Healthcheck

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Réponse attendue : `{"status":"ok"}`.

## Sauvegarde PostgreSQL

Une sauvegarde cohérente comprend :

1. un dump PostgreSQL ;
2. le volume `jaf_data` contenant les originaux ;
3. le volume `jaf_exports` contenant les versions produites ;
4. la version Git ou l’étiquette d’image correspondant au schéma.

Arrêter temporairement les écritures pendant l’opération. Chiffrer l’ensemble avec une clé conservée séparément. Ne pas considérer la sauvegarde comme valide avant un test de restauration sur une autre installation.

## Restauration

1. installer la même version de l’application ;
2. créer les volumes vides ;
3. restaurer la base puis les deux volumes documentaires ;
4. lancer les conteneurs ;
5. vérifier le healthcheck ;
6. ouvrir plusieurs pièces et comparer leurs empreintes ;
7. générer un export de contrôle.

La restauration guidée n’est pas encore intégrée à l’interface.

## Mise à jour

1. tester une sauvegarde ;
2. arrêter les écritures ;
3. récupérer la nouvelle version Git ;
4. lire les notes de version et les changements de schéma ;
5. reconstruire avec `docker compose up -d --build` ;
6. vérifier les logs, le healthcheck et un export.

Le point d’entrée emploie actuellement `prisma db push`. Pour un déploiement durable ou partagé, passer à des migrations SQL relues et versionnées avant la première mise en production.

## Incident de démarrage

Si PostgreSQL est encore en initialisation, l’application redémarre automatiquement. Vérifier :

```powershell
docker compose ps
docker compose logs --tail 100 db
docker compose logs --tail 100 app
```

Ne jamais supprimer les volumes pour résoudre un démarrage sans avoir identifié leur contenu et sécurisé une sauvegarde.

