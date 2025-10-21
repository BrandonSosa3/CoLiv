import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/lib/api/auth'
import { Building2 } from 'lucide-react'

interface SignupForm {
  companyName: string
  email: string
  password: string
  confirmPassword: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>()

  const password = watch('password')

  const onSubmit = async (data: SignupForm) => {
    try {
      setIsLoading(true)
      setError('')
      
      await authApi.signup({
        email: data.email,
        password: data.password,
        company_name: data.companyName, // ← Fixed: send company_name
        role: 'operator',
      })
      
      // Redirect to login after successful signup
      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in.' },
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#667eea]/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-[#764ba2]/10 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2]">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-center text-[#98989d]">
              Start managing your co-living properties
            </p>
          </CardHeader>

          <CardContent>
            {location.state?.message && (
              <div className="mb-4 p-3 rounded-lg bg-[#32d74b]/10 border border-[#32d74b]/20">
                <p className="text-[#32d74b] text-sm text-center">
                  {location.state.message}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/20">
                <p className="text-[#ff453a] text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Company Name"
                placeholder="Downtown Co-Living"
                error={errors.companyName?.message}
                {...register('companyName', {
                  required: 'Company name is required',
                })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-center text-[#636366] text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#667eea] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
