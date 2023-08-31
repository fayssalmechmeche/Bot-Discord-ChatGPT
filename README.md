
# GBT BOT

Un bot discord connecté à ChatGPT proposant une aventure pour aller combattre un dragon !
## FAQ

#### Qu'est-ce que c'est ? 

GPT Bot est un bot discord connecté à ChatGPT permettant de jouer faire jouer un jeu de rôle au utilisateur de ton serveur

#### Comment il marche ?

Tu dis Jouer et le bot supprimera tout les anciens messages et recommencera la partie à zero ! 

Si tu decides de mettre fin à la partie tout seul, tu dois seulement dire Fin de l'aventure et le bot terminera l'aventure.

Le bot peut aussi décider de terminer la partie tout seul si tu perds. 






## Authors

- [@fayssalmechmeche](https://github.com/fayssalmechmeche)


## Deployment

Pour lancer le bot

```bash
  npm i
  npm start
```


## Features

- Propose 3 choix au joueur
- Ping / Pong comme commande de base pour savoir si il fonctionne
- Peut supprimer tout les messages du salon avec "Jouer"



## ENV

variable

```env
TOKEN= token du bot

APPID= id du bot

OPENAI_API_KEY= token api chatgpt

SERVEUR= id du salon discord 
```
    
## Prochainement

- Ajout de boutons pour les choix

- Possibilité de jouer à plusieurs

- Optimisation du code
