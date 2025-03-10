import React, { createContext, useState, useContext, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  userRole: 'user' | 'brand_admin' | null
  brandInfo: any
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'brand_admin' | null>(null)
  const [brandInfo, setBrandInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserRole(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        
        if (session?.user) {
          // Add delay for signup event to allow profile creation to complete
          if (event === 'SIGNED_IN') {
            // Wait briefly to allow profile creation to complete
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
          setBrandInfo(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, brand_id')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, retry after a delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchUserRole(userId)
        }
        console.error('Error fetching user role:', error)
        return
      }

      setUserRole(data.role)
      
      // If user is a brand admin, fetch brand info
      if (data.role === 'brand_admin' && data.brand_id) {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('id', data.brand_id)
          .single()
          
        if (brandError) {
          console.error('Error fetching brand info:', brandError)
          return
        }
        setBrandInfo(brandData)
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error)
    }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      userRole, 
      brandInfo,
      loading, 
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 