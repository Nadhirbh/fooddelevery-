# Food Delivery Microservices Application

## Architecture globale

Cette application est construite selon une **architecture microservices** qui permet une séparation claire des responsabilités. Elle se compose de trois services principaux:

1. **API Gateway** (port 3001) - Point d'entrée unique pour les clients
2. **Restaurant Service** (port 50053) - Gestion des restaurants et des menus
3. **Order Service** (port 50054) - Gestion des commandes

### Schéma d'Architecture
```
Client → API Gateway → ┌─────────────────┐
                       │ Restaurant Service
                       └─────────────────┘
                       ┌─────────────────┐
                       │ Order Service    
                       └─────────────────┘
                            ↑
                            ↓
                       ┌─────────────────┐
                       │ Kafka (Events)   
                       └─────────────────┘
```

## Technologies utilisées

* **Node.js** - Environnement d'exécution JavaScript
* **Express.js** - Framework web pour l'API Gateway
* **gRPC** - Communication entre services (Remote Procedure Call)
* **Protocol Buffers** - Format de sérialisation pour gRPC
* **GraphQL** - API flexible pour les clients
* **Apollo Server** - Serveur GraphQL
* **Kafka** - Système de messagerie pour la communication asynchrone

## Description des services

### API Gateway
Point d'entrée central qui expose:
- REST API (Express.js)
- GraphQL API (Apollo Server)

Responsabilités:
- Routage des requêtes vers les services appropriés
- Agrégation des données de différents services
- Interface unifiée pour les clients

### Restaurant Service
Service gRPC qui gère:
- Liste des restaurants
- Menus des restaurants
- Informations sur les plats

Chaque restaurant contient:
- ID unique
- Nom
- Adresse
- Type de cuisine
- Menu avec items (nom, description, prix)

### Order Service
Service gRPC qui gère:
- Création de commandes
- Suivi de l'état des commandes
- Historique des commandes

Chaque commande contient:
- ID unique
- Identifiant du restaurant
- Nom du client
- Adresse de livraison
- Items commandés
- Statut de la commande (REÇUE, EN PRÉPARATION, EN LIVRAISON, LIVRÉE)

### Kafka
Système de messagerie pour:
- Communication asynchrone entre services
- Notifications d'événements (création de commande, changement de statut)
- Architecture événementielle

## Communication entre services

Les services communiquent de deux façons:

1. **Synchrone** via gRPC:
   - Appels directs entre services pour les opérations CRUD
   - Protocole efficace et typé avec Protocol Buffers

2. **Asynchrone** via Kafka:
   - Notification d'événements entre services
   - Découplage des services
   - Résilience accrue

## Comment démarrer l'application

Pour exécuter l'application complète, vous devez lancer les services dans cet ordre:

1. **Démarrer le Restaurant Service**:
   ```
   npm run start:restaurant
   ```

2. **Démarrer l'Order Service**:
   ```
   npm run start:order
   ```

3. **Démarrer l'API Gateway**:
   ```
   npm start
   ```

L'API Gateway sera accessible à:
- REST API: http://localhost:3001
- GraphQL API: http://localhost:3001/graphql

## API Endpoints

### REST API

#### Restaurants
- `GET /restaurants` - Liste tous les restaurants
- `GET /restaurants/:id` - Obtient un restaurant spécifique
- `POST /restaurants` - Crée un nouveau restaurant

#### Commandes
- `GET /orders` - Liste toutes les commandes
- `GET /orders/:id` - Obtient une commande spécifique
- `POST /orders` - Crée une nouvelle commande

### GraphQL API

L'API GraphQL permet des requêtes flexibles comme:

```graphql
# Requête pour obtenir tous les restaurants avec leurs menus
query {
  restaurants {
    id
    name
    address
    cuisineType
    menu {
      id
      name
      description
      price
    }
  }
}

# Requête pour obtenir une commande avec les détails du restaurant
query {
  order(id: "1") {
    id
    customerName
    items {
      menuItemId
      quantity
    }
    status
    restaurant {
      name
      address
    }
  }
}

# Mutation pour créer une commande
mutation {
  createOrder(input: {
    restaurantId: "1",
    customerName: "Jean Dupont",
    deliveryAddress: "123 Rue de Paris",
    items: [
      { menuItemId: "1", quantity: 2 }
    ]
  }) {
    id
    status
  }
}
```

## Structure des fichiers

- **apiGateway.js** - Serveur principal combinant REST et GraphQL
- **restaurantService.js** - Implémentation du service Restaurant
- **orderService.js** - Implémentation du service Order
- **restaurantClient.js** - Client gRPC pour communiquer avec Restaurant Service
- **orderClient.js** - Client gRPC pour communiquer avec Order Service
- **resolvers.js** - Résolveurs GraphQL
- **schema.js** - Schéma GraphQL
- **restaurant.proto** - Définition Protocol Buffer pour Restaurant Service
- **order.proto** - Définition Protocol Buffer pour Order Service
- **kafka/** - Dossier contenant la configuration Kafka

## Explications techniques

### gRPC et Protocol Buffers

gRPC est un framework RPC (Remote Procedure Call) développé par Google qui:
- Utilise HTTP/2 pour le transport
- Supporte le streaming bidirectionnel
- Offre une génération automatique de code client/serveur
- Est plus performant que REST/JSON

Les fichiers `.proto` définissent:
- Les services disponibles (fonctions)
- Les types de messages (données)
- Les paramètres et retours des méthodes

### Kafka et l'architecture événementielle

Kafka fonctionne comme un journal d'événements distribué:
- Les producteurs écrivent des événements dans des topics
- Les consommateurs lisent ces événements
- Les événements sont conservés et peuvent être rejoués

Dans notre application:
- L'Order Service publie des événements sur la création/mise à jour de commandes
- Les autres services peuvent réagir à ces événements
- Cela permet de découpler les services et d'ajouter de nouveaux consommateurs sans modifier les services existants
