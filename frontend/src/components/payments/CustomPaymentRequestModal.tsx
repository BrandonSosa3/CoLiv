import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner'

interface Tenant {
  id: string;
  user_email: string;
  room_number?: string;
  unit_number?: string;
}

interface CustomPaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
}

const PAYMENT_TYPES = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'parking', label: 'Parking Fee' },
  { value: 'pet_fee', label: 'Pet Fee' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'custom', label: 'Custom' },
];

export const CustomPaymentRequestModal: React.FC<CustomPaymentRequestModalProps> = ({
  isOpen,
  onClose,
  propertyId,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    due_date: '',
    payment_type: 'custom',
    description: '',
    room_id: null,
  });

  // Fetch tenants for the property
  const { data: tenants, isLoading: loadingTenants } = useQuery<Tenant[]>({
    queryKey: ['tenants', propertyId],
    queryFn: async () => {
      const endpoint = propertyId 
        ? `/tenants/property/${propertyId}`
        : '/tenants/all';
      const response = await apiClient.get(endpoint);
      return response.data;
    },
    enabled: isOpen,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/payments/custom-request', {
        tenant_id: data.tenant_id,
        amount: parseFloat(data.amount),
        due_date: data.due_date,
        payment_type: data.payment_type,
        description: data.description,
        room_id: data.room_id,
        payment_method: 'manual',
        late_fee: 0,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment request created successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create payment request');
    },
  });

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      amount: '',
      due_date: '',
      payment_type: 'custom',
      description: '',
      room_id: null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenant_id || !formData.amount || !formData.due_date || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    createPaymentMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!createPaymentMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Payment Request</h2>
            <p className="text-sm text-gray-400 mt-1">
              Request a custom payment from a tenant
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={createPaymentMutation.isPending}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tenant <span className="text-red-400">*</span>
            </label>
            {loadingTenants ? (
              <div className="text-gray-400 text-sm">Loading tenants...</div>
            ) : (
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a tenant</option>
                {tenants?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.user_email}
                    {tenant.unit_number && tenant.room_number && 
                      ` - Unit ${tenant.unit_number}, Room ${tenant.room_number}`
                    }
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Payment Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {PAYMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Amount <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about this payment request..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This description will be visible to the tenant
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createPaymentMutation.isPending}
              className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payment Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
