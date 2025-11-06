import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, Eye, EyeOff, Home } from 'lucide-react'

interface EmailCheckForm {
  email: string
}

interface SignupForm {
  email: string
  password: string
  confirm_password: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'signup'>('email')
  const [eligibleEmail, setEligibleEmail] = useState('')
  const [tenantInfo, setTenantInfo] = useState<{ first_name: string; last_name: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm<EmailCheckForm>()
  const { register: registerSignup, handleSubmit: handleSignupSubmit, watch, formState: { errors: signupErrors } } = useForm<SignupForm>()

  const password = watch('password')

  const checkEmailMutation = useMutation({
    mutationFn: authApi.checkEmail,
    onSuccess: (response, variables) => {
      if (response.eligible) {
        setEligibleEmail(variables)
        setTenantInfo({ first_name: response.first_name || '', last_name: response.last_name || '' })
        setStep('signup')
        toast.success(response.message)
      } else {
        toast.error(response.message)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to check email')
    },
  })

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      localStorage.setItem('tenant_token', data.access_token)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create account')
    },
  })

  const onEmailSubmit = (data: EmailCheckForm) => {
    checkEmailMutation.mutate(data.email)
  }

  const onSignupSubmit = (data: SignupForm) => {
    signupMutation.mutate({
      email: eligibleEmail,
      password: data.password,
      confirm_password: data.confirm_password,
    })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Home className="w-12 h-12 text-[#667eea]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-center text-[#98989d]">
            Join your CoLiv community
          </p>
        </CardHeader>

        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#636366]" />
                  <input
                    type="email"
                    {...registerEmail('email', { required: 'Email is required' })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-[#ff453a] text-sm mt-1">{emailErrors.email.message}</p>
                )}
                <p className="text-[#636366] text-sm mt-2">
                  Enter the email address your property manager used to add you as a tenant.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={checkEmailMutation.isPending}
              >
                {checkEmailMutation.isPending ? 'Checking...' : 'Check Email'}
              </Button>

              <div className="text-center">
                <p className="text-[#636366] text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#667eea] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
              <div className="p-4 rounded-lg bg-[#32d74b]/10 border border-[#32d74b]/20">
                <p className="text-[#32d74b] text-sm">
                  ✓ Email verified! Welcome, {tenantInfo?.first_name} {tenantInfo?.last_name}
                </p>
              </div>

              <input type="hidden" {...registerSignup('email')} value={eligibleEmail} />

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#636366]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignup('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className="w-full pl-11 pr-12 py-3 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#636366] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="text-[#ff453a] text-sm mt-1">{signupErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#636366]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignup('confirm_password', { 
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
                {signupErrors.confirm_password && (
                  <p className="text-[#ff453a] text-sm mt-1">{signupErrors.confirm_password.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep('email')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-[#636366] text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#667eea] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
