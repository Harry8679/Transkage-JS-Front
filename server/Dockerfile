# Utilisation d'une image Node.js légère
FROM node:16-alpine

# Définition du répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers essentiels pour éviter des reconstructions inutiles
COPY package.json package-lock.json* ./

# Installation des dépendances
RUN npm install

# Copier tous les fichiers du projet dans le conteneur
COPY . .

# Exposition du port (doit correspondre à ce que tu mets dans `docker-compose.yml`)
EXPOSE 5050

# Commande pour démarrer le serveur avec Nodemon
CMD ["npx", "nodemon", "src/app.js"]