# Modèle de données

## Relations principales

```text
User
 └── FamilyCase
      ├── Child
      ├── Procedure
      ├── Event ──< EventEvidence >── Evidence
      ├── Allegation ──< AllegationEvidence >── Evidence
      │            └──< AllegationEvent >── Event
      ├── LegalRequest ──< RequestEvent >── Event
      │              └──< RequestEvidence >── Evidence
      ├── QualityAlert
      ├── ExportVersion
      └── AuditLog
```

## Entités

### `FamilyCase`

Porte la référence interne, les identités parentales, le contexte familial, le tribunal, l’avocat et les échéances. La contrainte `(ownerId, reference)` évite deux références identiques pour un même utilisateur.

### `Event`

Un fait daté de la chronologie. Les champs `sourceType`, `needsVerification`, `unfavorable` et `validationStatus` empêchent de présenter une information incertaine comme un fait validé.

### `Evidence`

Métadonnées d’un original : référence de pièce, nom original, chemin serveur relatif, type MIME, taille, source, catégorie, confidentialité, date du document, date d’import et SHA‑256. La contrainte `(caseId, pieceReference)` maintient un bordereau stable. Les métadonnées peuvent être corrigées ; le fichier original, son chemin, sa référence et son empreinte ne sont pas remplacés par la route de modification.

### `Allegation`

Contient le texte et la source d’une allégation, la réponse factuelle, le point à vérifier et son caractère éventuellement défavorable. Aucune qualification automatique de mensonge n’est stockée.

### `LegalRequest`

Formalise un objectif à discuter : situation actuelle, difficulté, changement envisagé, impact pratique pour l’enfant, alternatives et arbitrage attendu de l’avocat.

### Tables de jointure

Elles matérialisent le chemin :

```text
Demande → événement factuel → preuve
```

Un même document peut donc soutenir plusieurs événements ou demandes sans duplication du fichier original.

### `QualityAlert`

Résultat explicable d’un contrôle documentaire. Une alerte signale un manque ou une incohérence simple ; elle ne décide jamais de la recevabilité juridique.

### `ExportVersion`

Enregistre le numéro, le nom, le chemin, l’empreinte et le manifeste de chaque archive générée.

### `AuditLog`

Trace les connexions et actions sensibles sans recopier le contenu familial ou médical dans les journaux.

## Conventions

- identifiants CUID non séquentiels ;
- suppressions en cascade uniquement à l’intérieur d’un dossier appartenant au même utilisateur ;
- chemins stockés sous forme relative, puis résolus dans une racine autorisée ;
- pièces originales non remplaçables par les routes actuelles ;
- références humaines `P001`, `A001`, etc. générées dans le périmètre du dossier.

## Évolutions prévues

Les entités spécialisées à normaliser en phase suivante sont notamment : décisions et obligations, paiements de pension, revenus/charges, contacts vidéo, actes médicaux, témoins, démarches juridiques, questions à l’avocat et matrice détaillée des critères JAF.

