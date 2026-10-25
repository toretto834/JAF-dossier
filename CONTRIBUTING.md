# Contribution

## Prérequis

- Node.js 22 ;
- npm ou pnpm ;
- Docker pour les tests d’intégration ;
- une base PostgreSQL de développement.

## Vérifications avant commit

```bash
npx prisma validate
npm test
npm run build
docker compose config --quiet
docker compose -f docker-compose.sqlite.yml config --quiet
```

## Principes métier

- ne jamais prédire la décision d’un juge ;
- ne jamais attribuer de score à un parent ;
- distinguer faits, récits, documents et interprétations ;
- conserver les informations défavorables utiles à l’avocat ;
- ne jamais modifier un original ;
- expliquer chaque alerte documentaire ;
- ne pas déclarer automatiquement une pièce recevable ou irrecevable ;
- limiter les données de mineurs au strict nécessaire.

## Principes techniques

- toutes les ressources doivent être autorisées côté serveur par utilisateur et dossier ;
- valider toute entrée côté serveur ;
- stocker uniquement des chemins relatifs contrôlés ;
- neutraliser les cellules de tableur commençant par `=`, `+`, `-` ou `@` ;
- accompagner toute évolution du schéma d’une migration revue ;
- ajouter un test pour tout correctif de sécurité ou d’intégrité documentaire.

