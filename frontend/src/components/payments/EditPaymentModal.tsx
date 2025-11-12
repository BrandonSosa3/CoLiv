import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, Edit } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface Payment {
  id: string;
  tenant_id: string;
  tenant_email: string;
  amount: string;
  due_date: string;
  paid_date: string | null;
  payment_date?: string | null;
  status: string;
  payment_type: string;
  description: string | null;
  payment_method: string | null;
}

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const PAYMENT_TYPES = [
  { value: 'rent', label: 'Rent' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'parking', label: 'Parking Fee' },
  { value: 'pet_fee', label: 'Pet Fee' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'custom', label: 'Custom' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'failed', label: 'Failed' },
];

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: '',
    due_date: '',
    paid_date: '',
    status: 'pending',
    payment_type: 'rent',
    description: '',
    payment_method: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount,
        due_date: payment.due_date,
        paid_date: payment.paid_date || payment.payment_date || '',
        status: payment.status,
        payment_type: payment.payment_type || 'rent',
        description: payment.description || '',
        payment_method: payment.payment_method || '',
      });
    }
  }, [payment]);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.put(`/payments/${payment?.id}`, {
        paid_date: data.paid_date || null,
        status: data.status,
        payment_method: data.payment_method || null,
        late_fee: 0,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate multiple query keys to ensure all payment lists refresh
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast.success('Payment updated successfully');
      
      // Close modal after a brief delay to allow the UI to update
      setTimeout(() => {
        onClose();
      }, 300);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // If status is paid, paid_date is required
    if (formData.status === 'paid' && !formData.paid_date) {
      toast.error('Paid date is required when status is paid');
      return;
    }

    updatePaymentMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!updatePaymentMutation.isPending) {
      onClose();
    }
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Edit className="w-6 h-6" />
              Edit Payment
            </h2>
            <p className="text-sm text-[#98989d] mt-1">
              Editing payment for {payment.tenant_email}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={updatePaymentMutation.isPending}
            className="text-[#98989d] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount (Read-only for now) */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Amount
            </label>
            <input
              type="text"
              value={`$${parseFloat(formData.amount).toFixed(2)}`}
              disabled
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2c2c2e] rounded-lg text-[#636366] cursor-not-allowed"
            />
          </div>

          {/* Payment Type (Read-only for now) */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Payment Type
            </label>
            <input
              type="text"
              value={PAYMENT_TYPES.find(t => t.value === formData.payment_type)?.label || formData.payment_type}
              disabled
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2c2c2e] rounded-lg text-[#636366] cursor-not-allowed"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Status <span className="text-[#ff453a]">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              required
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date (Read-only for now) */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              disabled
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2c2c2e] rounded-lg text-[#636366] cursor-not-allowed"
            />
          </div>

          {/* Paid Date */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Paid Date {formData.status === 'paid' && <span className="text-[#ff453a]">*</span>}
            </label>
            <input
              type="date"
              value={formData.paid_date}
              onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              required={formData.status === 'paid'}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Payment Method
            </label>
            <input
              type="text"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              placeholder="e.g., Cash, Check, Bank Transfer"
              className="w-full px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-lg text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
            />
          </div>

          {/* Description (Read-only) */}
          {formData.description && (
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                disabled
                rows={3}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2c2c2e] rounded-lg text-[#636366] cursor-not-allowed resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={updatePaymentMutation.isPending}
              className="px-6 py-2.5 text-[#98989d] hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatePaymentMutation.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#6b3fa0] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updatePaymentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
