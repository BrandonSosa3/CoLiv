import stripe
import os
from decimal import Decimal
from app.config import settings

# Initialize Stripe with your secret key
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    def create_payment_intent(amount: Decimal, payment_id: str, tenant_email: str):
        """
        Create a Stripe payment intent for a payment
        Amount is in dollars, Stripe expects cents
        """
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert dollars to cents
                currency="usd",
                payment_method_types=["card", "us_bank_account"],  # Allow cards and ACH
                metadata={
                    "payment_id": payment_id,
                    "tenant_email": tenant_email,
                },
                receipt_email=tenant_email,
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def retrieve_payment_intent(payment_intent_id: str):
        """Retrieve a payment intent to check its status"""
        try:
            return stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
