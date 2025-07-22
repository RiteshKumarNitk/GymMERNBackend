// Stub for payment integration
exports.createPaymentIntent = async (amount, currency) => {
  // Integration with Stripe or Razorpay would go here
  return { clientSecret: 'dummy_client_secret' };
};