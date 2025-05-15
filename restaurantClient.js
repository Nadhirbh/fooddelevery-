// restaurantClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the restaurant proto file
const PROTO_PATH = './restaurant.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const restaurantProto = grpc.loadPackageDefinition(packageDefinition);
const client = new restaurantProto.RestaurantService('localhost:50053', grpc.credentials.createInsecure());

// Client methods
module.exports = {
  getAllRestaurants: () => {
    return new Promise((resolve, reject) => {
      client.GetAllRestaurants({}, (err, response) => {
        if (err) {
          console.error('[gRPC] GetAllRestaurants Error:', err.message);
          return reject(err);
        }
        resolve(response.restaurants);
      });
    });
  },

  getRestaurantById: (id) => {
    return new Promise((resolve, reject) => {
      client.GetRestaurant({ id }, (err, response) => {
        if (err) {
          console.error('[gRPC] GetRestaurant Error:', err.message);
          return reject(err);
        }
        resolve(response);
      });
    });
  },

  createRestaurant: (restaurantData) => {
    return new Promise((resolve, reject) => {
      client.CreateRestaurant(restaurantData, (err, response) => {
        if (err) {
          console.error('[gRPC] CreateRestaurant Error:', err.message);
          return reject(err);
        }
        resolve(response);
      });
    });
  }
};
