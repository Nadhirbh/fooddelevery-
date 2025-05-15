const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka } = require('kafkajs');

// Charger le proto
const PROTO_PATH = './order.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const orderProto = grpc.loadPackageDefinition(packageDefinition).OrderService;

// Simuler une base de données en mémoire
let orders = [];
let orderIdCounter = 1;

// Kafka setup
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092']
});
const producer = kafka.producer();

const sendKafkaMessage = async (topic, message) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
};

// Implémentation du service
const service = {
  GetOrder: (call, callback) => {
    const order = orders.find(o => o.id === call.request.id);
    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Order not found',
      });
    }
    callback(null, order);
  },

  GetAllOrders: (_, callback) => {
    callback(null, { orders });
  },

  CreateOrder: async (call, callback) => {
    const req = call.request;

    const newOrder = {
      id: `${orderIdCounter++}`,
      customerName: req.customerName,
      deliveryAddress: req.deliveryAddress,
      items: req.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
      status: 'RECEIVED',
      restaurantId: req.restaurantId,
      totalPrice: 0 // facultatif, calculable selon les données menu
    };

    orders.push(newOrder);

    await sendKafkaMessage('order-events', {
      eventType: 'ORDER_CREATED',
      orderId: newOrder.id,
      status: newOrder.status,
      customerName: newOrder.customerName
    });

    callback(null, newOrder);
  },

  UpdateOrderStatus: async (call, callback) => {
    const { id, status } = call.request;
    const order = orders.find(o => o.id === id);
    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;
    order.status = status;

    await sendKafkaMessage('order-events', {
      eventType: 'ORDER_STATUS_UPDATED',
      orderId: order.id,
      previousStatus,
      newStatus: order.status
    });

    callback(null, order);
  },
};

// Créer et lancer le serveur gRPC
const server = new grpc.Server();
server.addService(orderProto.service, service);
const PORT = 'localhost:50054';

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Erreur lors du démarrage du serveur :', err);
    return;
  }
  console.log(`✅ OrderService gRPC Server en écoute sur le port ${port}`);
  server.start();
});
