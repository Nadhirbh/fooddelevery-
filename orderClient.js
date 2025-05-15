// orderClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the order proto file
const PROTO_PATH = './order.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const orderProto = grpc.loadPackageDefinition(packageDefinition);
const client = new orderProto.OrderService('localhost:50054', grpc.credentials.createInsecure());

// Client methods
module.exports = {
  getAllOrders: () => {
    return new Promise((resolve, reject) => {
      client.GetAllOrders({}, (err, response) => {
        if (err) {
          console.error('[gRPC] GetAllOrders Error:', err.message);
          return reject(err);
        }
        resolve(response.orders);
      });
    });
  },

  getOrderById: (id) => {
    return new Promise((resolve, reject) => {
      client.GetOrder({ id }, (err, response) => {
        if (err) {
          console.error('[gRPC] GetOrder Error:', err.message);
          return reject(err);
        }
        resolve(response);
      });
    });
  },

  createOrder: (orderData, kafka) => {
    return new Promise((resolve, reject) => {
      client.CreateOrder(orderData, (err, response) => {
        if (err) {
          console.error('[gRPC] CreateOrder Error:', err.message);
          return reject(err);
        }
        resolve(response);
      });
    });
  },

  updateOrderStatus: (id, status, kafka) => {
    return new Promise((resolve, reject) => {
      client.UpdateOrderStatus({ id, status }, (err, response) => {
        if (err) {
          console.error('[gRPC] UpdateOrderStatus Error:', err.message);
          return reject(err);
        }
        resolve(response);
      });
    });
  }
};
