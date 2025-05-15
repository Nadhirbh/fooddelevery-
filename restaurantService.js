// restaurantService.js

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Charger le fichier restaurant.proto
const PROTO_PATH = './restaurant.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const restaurantProto = grpc.loadPackageDefinition(packageDefinition);

// Simuler une base de données en mémoire
let restaurants = [];
let nextId = 1;

// Implémentation du service RestaurantService
const restaurantService = {
  GetRestaurant: (call, callback) => {
    const restaurant = restaurants.find(r => r.id === call.request.id);
    if (!restaurant) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Restaurant not found'
      });
    }
    callback(null, restaurant);
  },

  GetAllRestaurants: (_, callback) => {
    callback(null, { restaurants });
  },

  CreateRestaurant: (call, callback) => {
    const req = call.request;
    const restaurant = {
      id: `${nextId++}`,
      name: req.name,
      address: req.address,
      cuisineType: req.cuisineType,
      menu: req.menu.map((item, index) => ({
        id: `${index + 1}`,
        name: item.name,
        description: item.description || '',
        price: item.price
      }))
    };
    restaurants.push(restaurant);
    callback(null, restaurant);
  }
};

// Créer et lancer le serveur gRPC
const server = new grpc.Server();
server.addService(restaurantProto.RestaurantService.service, restaurantService);
const PORT = 'localhost:50053';

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Erreur lors du démarrage du serveur :', err);
    return;
  }
  console.log(` RestaurantService gRPC Server en écoute sur le port ${port}`);
  server.start();
});
