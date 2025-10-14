import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { profileApi } from '@/lib/api/profile'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { User, Lock, Mail, Calendar, DollarSign } from 'lucide-react'

interface EmailFormData {
  email: string
}

interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['tenant-profile'],
    queryFn: profileApi.getProfile,
  })

  const emailForm = useForm<EmailFormData>({
    defaultValues: {
      email: profile?.email || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>()

  const updateEmailMutation = useMutation({
    mutationFn: (email: string) => profileApi.updateProfile(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-profile'] })
      toast.success('Email updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update email')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ current, newPass }: { current: string; newPass: string }) =>
      profileApi.changePassword(current, newPass),
    onSuccess: () => {
      toast.success('Password changed successfully')
      passwordForm.reset()
      setShowPasswordForm(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    },
  })

  const onEmailSubmit = (data: EmailFormData) => {
    updateEmailMutation.mutate(data.email)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    if (data.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    changePasswordMutation.mutate({
      current: data.current_password,
      newPass: data.new_password,
    })
  }

  if (isLoading) {
    return <LoadingScreen message="Loading profile..." />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-[#98989d] mt-2">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <User className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#636366] mb-1">Account Status</label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  profile?.status === 'active'
                    ? 'bg-[#32d74b]/10 text-[#32d74b] border border-[#32d74b]/20'
                    : 'bg-[#ffd60a]/10 text-[#ffd60a] border border-[#ffd60a]/20'
                }`}>
                  {profile?.status}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#636366] mb-1">Member Since</label>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 text-[#636366]" />
                {profile && new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#636366] mb-1">Lease Period</label>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 text-[#636366]" />
                {profile && `${new Date(profile.lease_start).toLocaleDateString()} - ${new Date(profile.lease_end).toLocaleDateString()}`}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#636366] mb-1">Monthly Rent</label>
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="w-4 h-4 text-[#636366]" />
                ${profile && Number(profile.rent_amount).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Mail className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Email Address</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Email
              </label>
              <input
                type="email"
                {...emailForm.register('email', { required: 'Email is required' })}
                defaultValue={profile?.email}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={updateEmailMutation.isPending}
            >
              {updateEmailMutation.isPending ? 'Updating...' : 'Update Email'}
            </Button>
          </form>
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
              <h2 className="text-xl font-semibold text-white">Password</h2>
            </div>
            {!showPasswordForm && (
              <Button
                variant="secondary"
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('current_password', { required: 'Current password is required' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('new_password', { required: 'New password is required' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                />
                <p className="mt-1 text-xs text-[#636366]">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('confirm_password', { required: 'Please confirm password' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordForm(false)
                    passwordForm.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
