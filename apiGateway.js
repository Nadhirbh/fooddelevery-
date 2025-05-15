const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { Kafka } = require('kafkajs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(express.json());

// ✅ Kafka setup
let kafka;
try {
  kafka = new Kafka({
    clientId: 'api-gateway',
    brokers: ['localhost:9092']
  });
  console.log('✅ Kafka client initialized (connection will be tested when used)');
} catch (error) {
  console.warn('⚠️ Kafka initialization error:', error.message);
  console.warn('⚠️ Some functionality may be limited without Kafka');
  kafka = null;
}

// ✅ gRPC client setup 
const orderProtoPath = './order.proto';
const orderPackageDef = protoLoader.loadSync(orderProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const orderProto = grpc.loadPackageDefinition(orderPackageDef);
let orderClient;
try {
  orderClient = new orderProto.OrderService('localhost:50054', grpc.credentials.createInsecure());
  console.log('✅ Connected to Order Service gRPC on localhost:50054');
} catch (error) {
  console.error('❌ Failed to connect to Order Service:', error.message);
  console.warn('⚠️ Order-related functionality will be limited');
}

// ✅ REST Endpoints
app.get('/orders', (req, res) => {
  if (!orderClient) {
    return res.status(503).json({ error: 'Service Order non disponible' });
  }
  
  orderClient.GetAllOrders({}, (err, response) => {
    if (err) {
      console.error('[gRPC] GetAllOrders Error:', err.message);
      return res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
    res.json(response.orders);
  });
});

app.get('/orders/:id', (req, res) => {
  if (!orderClient) {
    return res.status(503).json({ error: 'Service Order non disponible' });
  }

  orderClient.GetOrder({ id: req.params.id }, (err, response) => {
    if (err) {
      console.error('[gRPC] GetOrder Error:', err.message);
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json(response);
  });
});

app.post('/orders', (req, res) => {
  if (!orderClient) {
    return res.status(503).json({ error: 'Service Order non disponible' });
  }

  const orderData = req.body;
  orderClient.CreateOrder(orderData, (err, response) => {
    if (err) {
      console.error('[gRPC] CreateOrder Error:', err.message);
      return res.status(400).json({ error: 'Erreur de création de commande' });
    }
    res.status(201).json(response);
  });
});

// ✅ GraphQL Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ kafka })
});

async function startApollo() {
  try {
    await server.start();
    server.applyMiddleware({ app });

    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`✅ REST API Gateway: http://localhost:${PORT}`);
      console.log(`✅ GraphQL API: http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage de l\'API Gateway :', error.message);
  }
}

startApollo();
