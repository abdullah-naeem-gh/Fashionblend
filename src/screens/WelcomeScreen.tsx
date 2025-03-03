import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'

export default function WelcomeScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [accountType, setAccountType] = useState<'user' | 'brand'>('user')
  
  // Brand details
  const [brandName, setBrandName] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [step, setStep] = useState(1) // For multi-step form

  const handleAuth = async () => {
    if (isSignUp && accountType === 'brand' && step === 1) {
      // Validate brand details
      if (!brandName) {
        Alert.alert('Error', 'Please enter your brand name')
        return
      }
      setStep(2)
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        console.log('Starting signup process...')
        
        // Sign up - will create user immediately since email confirmation is off
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: accountType === 'brand' ? 'brand_admin' : 'user',
            }
          }
        })

        if (signUpError) {
          console.error('Auth signup error:', signUpError)
          throw signUpError
        }
        
        console.log('Auth signup successful, user:', signUpData.user?.id)

        // If brand account, create brand first
        if (accountType === 'brand' && signUpData.user) {
          try {
            console.log('Creating brand profile...')
            
            // Call the database function to create brand and profile
            const { error: funcError } = await supabase.rpc('create_brand_and_profile', {
              brand_name: brandName,
              brand_description: brandDescription || '',
              brand_website: brandWebsite || '',
              user_id: signUpData.user.id,
              user_email: email
            })

            if (funcError) {
              console.error('Function call error:', funcError)
              throw funcError
            }
            
            console.log('Brand and profile created successfully')
            Alert.alert('Success', 'Your brand account has been created successfully')
          } catch (innerError: any) {
            console.error('Error in brand creation flow:', innerError)
            Alert.alert('Brand Creation Error', innerError.message || 'Failed to create brand')
            
            // Clean up the auth user since we couldn't complete the process
            await supabase.auth.signOut()
            throw innerError
          }
        } else if (signUpData.user) {
          // Regular user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              role: 'user',
              email: email,
              created_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('User profile creation error:', profileError)
            throw profileError
          }
          
          console.log('User profile created successfully')
          Alert.alert('Success', 'Your account has been created successfully')
        }

        setStep(1) // Reset step
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }
    } catch (error: any) {
      console.error('Overall auth error:', error)
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    if (isSignUp && accountType === 'brand' && step === 1) {
      // Brand details form
      return (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Brand Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Brand Name *"
            value={brandName}
            onChangeText={setBrandName}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brand Description"
            value={brandDescription}
            onChangeText={setBrandDescription}
            multiline
            numberOfLines={4}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Brand Website"
            value={brandWebsite}
            onChangeText={setBrandWebsite}
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setAccountType('user')
              setStep(1)
            }}
          >
            <Text style={styles.switchButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )
    }
    
    // Default auth form
    return (
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isSignUp && (
          <View style={styles.accountTypeContainer}>
            <Text style={styles.label}>Account Type:</Text>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity 
                style={[
                  styles.accountTypeButton,
                  accountType === 'user' && styles.selectedAccountType
                ]}
                onPress={() => setAccountType('user')}
              >
                <Text style={[
                  styles.accountTypeText,
                  accountType === 'user' && styles.selectedAccountTypeText
                ]}>User</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.accountTypeButton,
                  accountType === 'brand' && styles.selectedAccountType
                ]}
                onPress={() => setAccountType('brand')}
              >
                <Text style={[
                  styles.accountTypeText,
                  accountType === 'brand' && styles.selectedAccountTypeText
                ]}>Brand</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' }}
          style={styles.background}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>FashionBlend</Text>
                </View>
                
                <View style={styles.contentContainer}>
                  <Text style={styles.title}>Welcome to FashionBlend</Text>
                  <Text style={styles.subtitle}>
                    Discover clothes, create outfits, get inspired by fashion from around the world
                  </Text>
                  
                  {renderForm()}
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  contentContainer: {
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  accountTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  accountTypeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedAccountType: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedAccountTypeText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 50 : 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  }
}) 