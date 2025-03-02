import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, Modal, ActivityIndicator } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import AppHeader from '../components/AppHeader'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'

const TopTab = createMaterialTopTabNavigator()

// Add these types at the top
type SavedItem = {
  id: string
  image_url: string
  title: string
  created_at: string
}

function SavedClothesTab() {
  const [clothes, setClothes] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  const fetchSavedClothes = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          clothing_items (
            id,
            image_url,
            title,
            created_at
          )
        `)
        .eq('user_id', session?.user?.id)
        .eq('type', 'clothes')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClothes(data.map(like => like.clothing_items))
    } catch (error) {
      console.error('Error fetching saved clothes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedClothes()
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (clothes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>No saved clothes yet</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={clothes}
      numColumns={2}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.savedItem}>
          <Image source={{ uri: item.image_url }} style={styles.savedItemImage} />
          <Text style={styles.savedItemTitle} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.savedItemsContainer}
    />
  )
}

function SavedOutfitsTab() {
  const [outfits, setOutfits] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  const fetchSavedOutfits = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          outfit_posts (
            id,
            image_url,
            title,
            created_at
          )
        `)
        .eq('user_id', session?.user?.id)
        .eq('type', 'outfit')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOutfits(data.map(like => like.outfit_posts))
    } catch (error) {
      console.error('Error fetching saved outfits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedOutfits()
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (outfits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>No saved outfits yet</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={outfits}
      numColumns={2}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.savedItem}>
          <Image source={{ uri: item.image_url }} style={styles.savedItemImage} />
          <Text style={styles.savedItemTitle} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.savedItemsContainer}
    />
  )
}

function UploadedTab() {
  const [uploads, setUploads] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  const fetchUploads = async () => {
    try {
      const { data: clothes, error: clothesError } = await supabase
        .from('clothing_items')
        .select('id, image_url, title, created_at')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })

      const { data: outfits, error: outfitsError } = await supabase
        .from('outfit_posts')
        .select('id, image_url, title, created_at')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })

      if (clothesError) throw clothesError
      if (outfitsError) throw outfitsError

      setUploads([...(clothes || []), ...(outfits || [])])
    } catch (error) {
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (uploads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cloud-upload-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>You haven't uploaded any items yet</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Now</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      data={uploads}
      numColumns={2}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.savedItem}>
          <Image source={{ uri: item.image_url }} style={styles.savedItemImage} />
          <Text style={styles.savedItemTitle} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.savedItemsContainer}
    />
  )
}

const ComingSoonModal = ({ 
  visible, 
  onClose, 
  title, 
  description 
}: { 
  visible: boolean
  onClose: () => void
  title: string
  description: string 
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <LinearGradient
          colors={['#000', '#333']}
          style={styles.modalGradient}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  </Modal>
)

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const username = session?.user?.email?.split('@')[0] || 'User'
  const initials = username.charAt(0).toUpperCase()
  const [showAIWardrobeModal, setShowAIWardrobeModal] = useState(false)
  const [showAIStylerModal, setShowAIStylerModal] = useState(false)

  return (
    <View style={styles.container}>
      <AppHeader title="Profile" showSearch={false} />
      
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.bio}>Fashion enthusiast</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.aiFeatures}>
        <TouchableOpacity 
          style={styles.aiFeatureButton}
          onPress={() => setShowAIWardrobeModal(true)}
        >
          <Ionicons name="shirt" size={24} color="#000" />
          <Text style={styles.aiFeatureText}>AI Wardrobe</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.aiFeatureButton}
          onPress={() => setShowAIStylerModal(true)}
        >
          <Ionicons name="color-wand" size={24} color="#000" />
          <Text style={styles.aiFeatureText}>AI Styler</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <TopTab.Navigator
        screenOptions={{
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.tabIndicator,
        }}
      >
        <TopTab.Screen name="Saved Clothes" component={SavedClothesTab} />
        <TopTab.Screen name="Saved Outfits" component={SavedOutfitsTab} />
        <TopTab.Screen name="Uploaded" component={UploadedTab} />
      </TopTab.Navigator>
      
      <ComingSoonModal
        visible={showAIWardrobeModal}
        onClose={() => setShowAIWardrobeModal(false)}
        title="AI Wardrobe - Coming Soon!"
        description="Get personalized wardrobe recommendations based on your style preferences and existing clothes. Our AI will help you build the perfect wardrobe!"
      />
      
      <ComingSoonModal
        visible={showAIStylerModal}
        onClose={() => setShowAIStylerModal(false)}
        title="AI Styler - Coming Soon!"
        description="Let our AI create perfect outfit combinations from your wardrobe. Get daily outfit suggestions based on weather, occasion, and your style!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bio: {
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  editButtonText: {
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  signOutButtonText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  tabLabel: {
    textTransform: 'none',
    fontWeight: '600',
    fontSize: 12,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabIndicator: {
    backgroundColor: '#000',
  },
  savedItemsContainer: {
    padding: 10,
  },
  savedItem: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savedItemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  savedItemTitle: {
    padding: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  aiFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  aiFeatureButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  aiFeatureText: {
    marginTop: 5,
    fontWeight: '600',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 