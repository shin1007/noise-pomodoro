# Noise Pomodoro

[日本語](README.ja.md) | [English](README.md) | [中文](README.zh.md) | [Español](README.es.md)

Génère du bruit blanc, rose et brun, des tonalités isochrones, des battements binauraux et des fréquences solfège, avec la lecture de fichiers audio locaux et l'exécution de code JavaScript personnalisé pour générer une forme d'onde. Inclut une minuterie Pomodoro intégrée qui permet d'associer un son différent aux périodes de concentration et de pause.

## Captures d'écran

<table>
<tr>
<td align="center" width="25%"><img src="images/screenshots/main-panel.png" width="280" alt="Vue par défaut du panneau" /><br />Vue par défaut</td>
<td align="center" width="25%"><img src="images/screenshots/playing-preset.png" width="280" alt="Un préréglage en cours de lecture" /><br />Préréglage en lecture</td>
<td align="center" width="25%"><img src="images/screenshots/pomodoro.png" width="280" alt="Minuteur Pomodoro en cours" /><br />Pomodoro en cours</td>
<td align="center" width="25%"><img src="images/screenshots/pomodoro-settings.png" width="280" alt="Fenêtre des réglages Pomodoro" /><br />Réglages Pomodoro</td>
</tr>
</table>

## Fonctionnalités

- **Sources sonores générées** : Bruit blanc, rose et brun, tonalités isochrones, battements binauraux et fréquences solfège, générés sur un AudioWorklet pour une lecture sans accroc pendant les interactions avec l'interface.
- **Lecture de fichier** : Lisez un fichier audio local de votre choix.
- **Code personnalisé** : Écrivez une expression JavaScript utilisant `t` (secondes écoulées) et `params` (paramètres arbitraires) pour générer une forme d'onde comprise entre -1 et 1 et la jouer à la volée.
- **Minuteur Pomodoro** : Définissez indépendamment les durées de concentration et de pause, et associez un son à chaque phase. Prend en charge le passage automatique de phase, une notification de fin de phase, un carillon ponctuel et des scripts personnalisés.
- **Centré sur la barre d'état** : Ouvrez le panneau depuis la barre d'état. La lecture continue même lorsque le panneau est fermé, et la barre d'état reste votre point de contrôle même en mode Zen.

## Utilisation

1. Cliquez sur l'icône de la barre d'état, ou exécutez « Noise Pomodoro: Open Panel » depuis la palette de commandes, pour ouvrir le panneau.
2. Choisissez un préréglage sonore pour démarrer la lecture.
3. Dans la section Pomodoro, définissez les durées de concentration/pause et le son de chaque phase, puis appuyez sur Start.

## Tests (pour les contributeurs)

Si vous découvrez le développement d'extensions, voici un ordre de vérification pratique :

1. Exécutez `npm install` dans le terminal.
2. Exécutez `npm run watch` pour reconstruire automatiquement à chaque modification du code source.
3. Appuyez sur F5 dans VS Code pour lancer l'Extension Development Host.
4. Dans la nouvelle fenêtre, ouvrez la palette de commandes et exécutez « Noise Pomodoro: Open Panel ».
5. Essayez, dans l'ordre :
	- Sélectionner un préréglage et vérifier que le son est joué.
	- Vérifier que la lecture continue après la fermeture du panneau.
	- Vérifier que la barre d'état affiche le nom du préréglage en cours de lecture.
	- Utiliser Start / Pause / Reset / Skip sur le Pomodoro et vérifier que l'affichage et l'état restent synchronisés.
	- Si un préréglage de lecture de fichier existe, vérifier qu'on peut sélectionner et lire un fichier audio local.
	- Si le mode code personnalisé existe, saisir une expression simple, l'appliquer, et vérifier qu'un message d'erreur apparaît en cas d'échec.
6. Pour consulter les journaux, ouvrez le canal de sortie « Noise Pomodoro » dans VS Code.
7. Après chaque modification, répétez la vérification dans l'hôte de développement F5 : réaffichez le panneau pour les changements d'interface, ou attendez la reconstruction watch et retestez pour les changements d'implémentation.

## Paramètres

- `noisePomodoro.enablePhaseEndScripts` : Autorise l'exécution de scripts personnalisés en fin de phase. Valeur par défaut `false`. S'exécute avec les privilèges de l'hôte d'extension / Node, n'utilisez donc que des scripts que vous avez écrits vous-même.
- `noisePomodoro.statusBar.updateIntervalMs` : Intervalle de mise à jour de la barre d'état du Pomodoro, en millisecondes. Valeur par défaut `1000`.

## Développement

```bash
npm install
npm run watch
```

Appuyez sur F5 dans VS Code pour lancer l'Extension Development Host.
