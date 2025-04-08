# ScaleStorm

![License](https://img.shields.io/github/license/razano26/ScaleStorm)
![Build](https://img.shields.io/github/actions/workflow/status/razano26/ScaleStorm/main.yml)
![Version](https://img.shields.io/github/v/release/razano26/ScaleStorm)

ScaleStorm est une application de démonstration pour la gestion et le scaling d'applications Kubernetes. Elle permet de visualiser et de gérer les pods Kubernetes, ainsi que de configurer l'auto-scaling basé sur l'utilisation des ressources.

## Fonctionnalités principales

- 🎯 Visualisation en temps réel des pods Kubernetes
- 📊 Monitoring des ressources (CPU, mémoire)
- ⚙️ Configuration de l'auto-scaling
- 🚀 Interface utilisateur moderne et intuitive
- 📈 Gestion des requêtes par seconde
- ⏱️ Visualisation du temps de réponse
- 🔄 Mises à jour en temps réel

## Architecture du projet

Le projet est composé de quatre microservices distincts :

### Frontend (`/front`)

- Application Next.js avec TypeScript
- Interface utilisateur moderne avec Tailwind CSS
- Composants UI avec Radix UI
- Visualisation des données avec Recharts
- Communication en temps réel avec Socket.IO

### Backend (`/api`)

- API REST écrite en Rust avec Axum
- Intégration avec l'API Kubernetes
- Gestion des pods et de l'auto-scaling
- Support CORS pour la communication avec le frontend

### Fake API (`/fake-api`)

- API REST écrite en Rust avec Axum
- Simulation d'un service réel
- Gestion des pods et de l'auto-scaling
- Support CORS pour la communication avec le frontend

### Stress Generator (`/stress-generator`)

- API REST écrite en Rust avec Axum
- Génération de charge de travail contrôlée
- Configuration du nombre de requêtes par seconde
- Simulation de conditions réelles d'utilisation
- Support CORS pour la communication avec le frontend

## Technologies utilisées

- **Frontend** : Next.js, TypeScript, Tailwind CSS, Radix UI, Recharts, Socket.IO
- **Backend** : Rust, Axum, Kubernetes API
- **Infrastructure** : Docker, Kubernetes
