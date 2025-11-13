import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: string;
  due_date: string;
  payment_type: string;
  description: string | null;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSuccess: () => void;
}

// Payment form component (inside Stripe Elements provider)
function CheckoutForm({ payment, onSuccess, onClose }: { payment: Payment; onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments?payment_success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        toast.success('Payment successful!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="px-6 py-2.5 text-[#98989d] hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#6b3fa0] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ${parseFloat(payment.amount).toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Stripe publishable key
    const loadStripeConfig = async () => {
      try {
        const response = await apiClient.get('/stripe/config');
        const stripe = await loadStripe(response.data.publishableKey);
        setStripePromise(stripe);
      } catch (error) {
        toast.error('Failed to load payment system');
      }
    };

    loadStripeConfig();
  }, []);

  useEffect(() => {
    if (isOpen && payment) {
      createPaymentIntent();
    }
  }, [isOpen, payment]);

  const createPaymentIntent = async () => {
    if (!payment) return;

    setLoading(true);
    try {
      const response = await apiClient.post(`/stripe/create-payment-intent/${payment.id}`);
      setClientSecret(response.data.clientSecret);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to initialize payment');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#667eea',
      colorBackground: '#141414',
      colorText: '#ffffff',
      colorDanger: '#ff453a',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Pay Rent
            </h2>
            <p className="text-sm text-[#98989d] mt-1">
              Amount: ${parseFloat(payment.amount).toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#98989d] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="p-6 border-b border-[#2c2c2e] bg-[#141414]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#98989d]">Payment Type:</span>
              <span className="text-white font-medium capitalize">{payment.payment_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#98989d]">Due Date:</span>
              <span className="text-white">{new Date(payment.due_date).toLocaleDateString()}</span>
            </div>
            {payment.description && (
              <div className="pt-2 mt-2 border-t border-[#2c2c2e]">
                <p className="text-sm text-[#98989d]">{payment.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />
              <span className="ml-3 text-[#98989d]">Loading payment form...</span>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <CheckoutForm payment={payment} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <div className="text-center py-8 text-[#ff453a]">
              Failed to load payment form. Please try again.
            </div>
          )}
        </div>

        {/* Payment Methods Info */}
        <div className="p-6 border-t border-[#2c2c2e] bg-[#141414]">
          <div className="flex items-start gap-3 text-sm">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[#98989d]">
                <CreditCard className="w-4 h-4" />
                <span>Credit/Debit Cards</span>
              </div>
              <div className="flex items-center gap-2 text-[#98989d]">
                <Building2 className="w-4 h-4" />
                <span>Bank Account (ACH)</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#636366] mt-3">
            💡 Tip: Paying with bank account (ACH) is usually cheaper than credit cards
          </p>
        </div>
      </div>
    </div>
  );
};

