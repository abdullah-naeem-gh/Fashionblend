import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { RootScreenNavigationProp } from '../types/navigation'

const CLOTHING_CATEGORIES = [
  'Casual',
  'Formal',
  'Traditional',
  'Streetwear',
  'Ethnic',
  'Western',
]

const AESTHETICS = [
  'Minimalist',
  'Bold',
  'Vintage',
  'Modern',
  'Bohemian',
  'Classic',
  'Street Style',
  'Old Money',
]

export default function PreferenceSetupScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const { session } = useAuth()
  const navigation = useNavigation<RootScreenNavigationProp>()

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleAesthetic = (aesthetic: string) => {
    setSelectedAesthetics(prev => 
      prev.includes(aesthetic)
        ? prev.filter(a => a !== aesthetic)
        : [...prev, aesthetic]
    )
  }

  const handleSavePreferences = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          clothing_categories: selectedCategories,
          aesthetics: selectedAesthetics,
        })

      if (error) throw error
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    } catch (error: any) {
      console.error('Error saving preferences:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Set Your Preferences</Text>
      <Text style={styles.subtitle}>
        This helps us personalize your experience
      </Text>

      <Text style={styles.sectionTitle}>Clothing Categories</Text>
      <View style={styles.optionsContainer}>
        {CLOTHING_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.option,
              selectedCategories.includes(category) && styles.selectedOption
            ]}
            onPress={() => toggleCategory(category)}
          >
            <Text style={[
              styles.optionText,
              selectedCategories.includes(category) && styles.selectedOptionText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Preferred Aesthetics</Text>
      <View style={styles.optionsContainer}>
        {AESTHETICS.map(aesthetic => (
          <TouchableOpacity
            key={aesthetic}
            style={[
              styles.option,
              selectedAesthetics.includes(aesthetic) && styles.selectedOption
            ]}
            onPress={() => toggleAesthetic(aesthetic)}
          >
            <Text style={[
              styles.optionText,
              selectedAesthetics.includes(aesthetic) && styles.selectedOptionText
            ]}>
              {aesthetic}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!selectedCategories.length || !selectedAesthetics.length) && styles.buttonDisabled
        ]}
        onPress={handleSavePreferences}
        disabled={loading || !selectedCategories.length || !selectedAesthetics.length}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
  },
  selectedOption: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    color: '#000',
  },
  selectedOptionText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
}) 