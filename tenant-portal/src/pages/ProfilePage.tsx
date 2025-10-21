import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { profileApi } from '@/lib/api/profile'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { User, Calendar, DollarSign, MapPin, Lock } from 'lucide-react'

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ProfilePage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordForm>()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['tenant-profile'],
    queryFn: profileApi.getProfile,
  })

  const { data: leaseInfo, isLoading: leaseLoading } = useQuery({
    queryKey: ['tenant-lease'],
    queryFn: profileApi.getLeaseInfo,
    retry: false, // Don't retry if tenant has no lease (moved out)
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      profileApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setIsChangingPassword(false)
      reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    },
  })

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  const newPassword = watch('newPassword')

  if (profileLoading) {
    return <LoadingScreen message="Loading profile..." />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-[#98989d] mt-2">Manage your account and lease information</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <User className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-lg font-semibold text-white">Account Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#636366] mb-1">Email</label>
              <p className="text-white">{profile?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-[#636366] mb-1">Account Status</label>
              <span className={`inline-flex px-2 py-1 rounded text-xs ${
                profile?.status === 'active' 
                  ? 'bg-[#32d74b]/10 text-[#32d74b] border border-[#32d74b]/20'
                  : 'bg-[#636366]/10 text-[#636366] border border-[#636366]/20'
              }`}>
                {profile?.status === 'active' ? 'Active' : profile?.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lease Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <MapPin className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-lg font-semibold text-white">Lease Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          {leaseLoading ? (
            <div className="text-center py-8">
              <p className="text-[#98989d]">Loading lease information...</p>
            </div>
          ) : !leaseInfo ? (
            <div className="text-center py-8">
              <p className="text-[#98989d]">No active lease found. You may have moved out.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#636366] mb-1">Property</label>
                <p className="text-white">{leaseInfo.property_name}</p>
              </div>
              <div>
                <label className="block text-sm text-[#636366] mb-1">Unit & Room</label>
                <p className="text-white">Unit {leaseInfo.unit_number}, Room {leaseInfo.room_number}</p>
              </div>
              <div>
                <label className="block text-sm text-[#636366] mb-1">Lease Period</label>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-[#636366]" />
                  {new Date(leaseInfo.lease_start).toLocaleDateString()} - {new Date(leaseInfo.lease_end).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#636366] mb-1">Monthly Rent</label>
                <div className="flex items-center gap-2 text-white">
                  <DollarSign className="w-4 h-4 text-[#636366]" />
                  ${Number(leaseInfo.rent_amount).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <Lock className="w-5 h-5 text-[#667eea]" />
              </div>
              <h2 className="text-lg font-semibold text-white">Security</h2>
            </div>
            {!isChangingPassword && (
              <Button
                variant="secondary"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  {...register('currentPassword', { required: 'Current password is required' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
                {errors.currentPassword && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  {...register('newPassword', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
                {errors.newPassword && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your new password',
                    validate: (value) => value === newPassword || 'Passwords do not match'
                  })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
                {errors.confirmPassword && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false)
                    reset()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-[#98989d]">
              Keep your account secure by using a strong password.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
