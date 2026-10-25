# Kit de présentation — Entraide Amicale

Ce dossier contient le texte et les scripts de préparation utilisés pour présenter **JAF Dossier** au groupe Entraide Amicale.

Les captures d’écran et vidéos générées restent sur la machine locale. Elles sont volontairement exclues du dépôt GitHub.

## Contenu

- `message.txt` : texte court prêt à publier ;
- `render_slides.py` et `slides-v2.txt` : scripts utilisés localement pour préparer la vidéo ;
- `capture_app.js` : script de capture des écrans de démonstration.

Toutes les informations visibles dans les captures sont fictives. Elles ne contiennent aucune donnée personnelle réelle.

## Message proposé

> Bonjour à tous 👋
>
> Je viens de créer « JAF Dossier », un outil local pensé pour transformer des documents éparpillés en un dossier clair : chronologie, pièces datées, réponses aux allégations, demandes à discuter avec l’avocat et export complet.
>
> Les données restent sur l’ordinateur et l’outil ne remplace pas un avocat. Le projet est open source et fonctionne avec Docker : quelques connaissances techniques sont nécessaires pour l’installer.
>
> Si cela peut aider des membres d’Entraide Amicale, je peux partager le dépôt GitHub.

## Régénérer la vidéo

Le script `render_slides.py` fabrique localement les visuels à partir des captures et d’un fond non versionnés. La vidéo peut ensuite être assemblée avec FFmpeg en H.264/AAC.

Le script de capture attend les variables d’environnement `JAF_DEMO_EMAIL` et `JAF_DEMO_PASSWORD`. Utilisez uniquement un compte de démonstration contenant des données fictives, puis supprimez-le après les captures.
