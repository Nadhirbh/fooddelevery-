const { gql } = require('apollo-server');

const typeDefs = gql`
  type Restaurant {
    id: ID!
    name: String!
    address: String!
    cuisineType: String!
    menu: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    price: Float!
  }

  type Order {
    id: ID!
    customerName: String!
    deliveryAddress: String!
    items: [OrderItem!]!
    status: OrderStatus!
    restaurant: Restaurant!
    totalPrice: Float!
  }

  type OrderItem {
    menuItemId: ID!
    quantity: Int!
  }

  enum OrderStatus {
    RECEIVED
    PREPARING
    READY_FOR_DELIVERY
    DELIVERING
    DELIVERED
    CANCELLED
  }

  input RestaurantInput {
    name: String!
    address: String!
    cuisineType: String!
    menu: [MenuItemInput!]!
  }

  input MenuItemInput {
    name: String!
    description: String
    price: Float!
  }

  input OrderInput {
    restaurantId: ID!
    customerName: String!
    deliveryAddress: String!
    items: [OrderItemInput!]!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    orders: [Order!]!
    order(id: ID!): Order
  }

  type Mutation {
    createRestaurant(input: RestaurantInput!): Restaurant!
    createOrder(input: OrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  }
`;

module.exports = typeDefs;
