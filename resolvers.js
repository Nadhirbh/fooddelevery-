const restaurantService = require('./restaurantClient');
const orderService = require('./orderClient');

module.exports = {
  Query: {
    restaurants: () => restaurantService.getAllRestaurants(),
    restaurant: (_, { id }) => restaurantService.getRestaurantById(id),
    orders: () => orderService.getAllOrders(),
    order: (_, { id }) => orderService.getOrderById(id)
  },
  Mutation: {
    createRestaurant: (_, { input }) => restaurantService.createRestaurant(input),
    createOrder: (_, { input }, context) => orderService.createOrder(input, context.kafka),
    updateOrderStatus: (_, { id, status }, context) => 
      orderService.updateOrderStatus(id, status, context.kafka)
  },
  Order: {
    restaurant: (order) => restaurantService.getRestaurantById(order.restaurantId)
  }
};