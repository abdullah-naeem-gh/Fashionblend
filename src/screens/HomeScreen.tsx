import React, { useRef, useState, useEffect } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, FlatList, SafeAreaView, Text, ActivityIndicator } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import AppHeader from '../components/AppHeader'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const TopTab = createMaterialTopTabNavigator()
const { width, height } = Dimensions.get('window')

// Calculate content height (full height minus header, tab bar, and bottom nav)
const HEADER_HEIGHT = 60 // Approximate header height
const TAB_BAR_HEIGHT = 48 // Material Top Tab height
const BOTTOM_NAV_HEIGHT = 80 // Approximate bottom nav height
const SAFE_AREA_BOTTOM = 34 // Safe area padding for notched devices
const CONTENT_HEIGHT = height - HEADER_HEIGHT - TAB_BAR_HEIGHT - BOTTOM_NAV_HEIGHT - SAFE_AREA_BOTTOM

// Add these types at the top of the file
type ClothingItemType = {
  id: string
  image_url: string
  title: string
  brand: string
  likes_count: number
  user_id: string
  created_at: string
}

type OutfitItemType = {
  id: string
  image_url: string
  title: string
  creator: string
  creator_name: string
  likes_count: number
  user_id: string
  created_at: string
}

function ClothingItem({ item }: { item: ClothingItemType }) {
  const [isLiked, setIsLiked] = useState(false)
  const { session } = useAuth()

  useEffect(() => {
    checkIfLiked()
  }, [])

  const checkIfLiked = async () => {
    if (!session?.user) return
    
    try {
      const { data, error } = await supabase
        .from('clothing_likes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('item_id', item.id)
        .maybeSingle()

      if (error) throw error
      setIsLiked(!!data)
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleLike = async () => {
    if (!session?.user) return
    
    try {
      if (isLiked) {
        const { error: likeError } = await supabase
          .from('clothing_likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('item_id', item.id)

        if (likeError) throw likeError

        const { error: updateError } = await supabase
          .from('clothing_items')
          .update({ likes_count: item.likes_count - 1 })
          .eq('id', item.id)

        if (updateError) throw updateError
        setIsLiked(false)
        item.likes_count = (item.likes_count || 0) - 1
      } else {
        const { error: likeError } = await supabase
          .from('clothing_likes')
          .insert({
            user_id: session.user.id,
            item_id: item.id
          })

        if (likeError) throw likeError

        const { error: updateError } = await supabase
          .from('clothing_items')
          .update({ likes_count: item.likes_count + 1 })
          .eq('id', item.id)

        if (updateError) throw updateError
        setIsLiked(true)
        item.likes_count = (item.likes_count || 0) + 1
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Alert.alert('Error', 'Failed to update like status')
    }
  }

  return (
    <View style={styles.fullScreenItem}>
      <Image source={{ uri: item.image_url }} style={styles.fullScreenImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.itemOverlay}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>{item.brand}</Text>
        </View>
        <View style={styles.interactionBar}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={isLiked ? "#ff3b30" : "#fff"} 
            />
            <Text style={styles.interactionText}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="bookmark-outline" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="share-social-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )
}

function OutfitItem({ item }: { item: OutfitItemType }) {
  const [isLiked, setIsLiked] = useState(false)
  const { session } = useAuth()

  useEffect(() => {
    checkIfLiked()
  }, [])

  const checkIfLiked = async () => {
    if (!session?.user) return
    
    try {
      const { data, error } = await supabase
        .from('outfit_likes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('item_id', item.id)
        .maybeSingle()

      if (error) throw error
      setIsLiked(!!data)
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleLike = async () => {
    if (!session?.user) return
    
    try {
      if (isLiked) {
        const { error: likeError } = await supabase
          .from('outfit_likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('item_id', item.id)

        if (likeError) throw likeError

        const { error: updateError } = await supabase
          .from('outfit_posts')
          .update({ likes_count: item.likes_count - 1 })
          .eq('id', item.id)

        if (updateError) throw updateError
        setIsLiked(false)
        item.likes_count = (item.likes_count || 0) - 1
      } else {
        const { error: likeError } = await supabase
          .from('outfit_likes')
          .insert({
            user_id: session.user.id,
            item_id: item.id
          })

        if (likeError) throw likeError

        const { error: updateError } = await supabase
          .from('outfit_posts')
          .update({ likes_count: item.likes_count + 1 })
          .eq('id', item.id)

        if (updateError) throw updateError
        setIsLiked(true)
        item.likes_count = (item.likes_count || 0) + 1
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Alert.alert('Error', 'Failed to update like status')
    }
  }

  return (
    <View style={styles.fullScreenItem}>
      <Image source={{ uri: item.image_url }} style={styles.fullScreenImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.itemOverlay}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>by {item.creator_name}</Text>
        </View>
        <View style={styles.interactionBar}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={isLiked ? "#ff3b30" : "#fff"} 
            />
            <Text style={styles.interactionText}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="bookmark-outline" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="share-social-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )
}

function ClothesFeed() {
  const [clothes, setClothes] = useState<ClothingItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchClothes = async () => {
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select(`
          *,
          likes_count,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const transformedClothes = data.map(item => ({
        id: item.id,
        image_url: item.image_url,
        title: item.title,
        brand: item.brand || '',
        likes_count: item.likes_count || 0,
        user_id: item.user_id,
        created_at: item.created_at
      }))

      setClothes(transformedClothes)
    } catch (error) {
      console.error('Error fetching clothes:', error)
      Alert.alert('Error', 'Failed to load clothes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchClothes()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchClothes()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <FlatList
      data={clothes}
      renderItem={({ item }) => <ClothingItem item={item} />}
      keyExtractor={item => item.id}
      pagingEnabled
      snapToInterval={CONTENT_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.feedContainer}
    />
  )
}

function OutfitsFeed() {
  const [outfits, setOutfits] = useState<OutfitItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOutfits = async () => {
    try {
      // First fetch outfit posts
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfit_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (outfitError) throw outfitError

      // Then fetch user profiles for these posts
      const userIds = outfitData.map(outfit => outfit.user_id)
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', userIds)

      if (userError) throw userError

      // Create a map of user data
      const userMap = new Map(userData.map(user => [user.id, user]))
      
      // Transform the data to match OutfitItemType
      const transformedOutfits = outfitData.map(outfit => {
        const user = userMap.get(outfit.user_id)
        return {
          id: outfit.id,
          image_url: outfit.image_url,
          title: outfit.title,
          creator: outfit.user_id,
          creator_name: user ? user.name : 'Anonymous',
          likes_count: outfit.likes_count || 0,
          user_id: outfit.user_id,
          created_at: outfit.created_at
        }
      })

      setOutfits(transformedOutfits)
    } catch (error) {
      console.error('Error fetching outfits:', error)
      Alert.alert('Error', 'Failed to load outfits')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOutfits()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOutfits()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <FlatList
      data={outfits}
      renderItem={({ item }) => <OutfitItem item={item} />}
      keyExtractor={item => item.id}
      pagingEnabled
      snapToInterval={CONTENT_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.feedContainer}
    />
  )
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="FashionBlend" />
      <TopTab.Navigator
        screenOptions={{
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.tabIndicator,
        }}
      >
        <TopTab.Screen name="Clothes" component={ClothesFeed} />
        <TopTab.Screen name="Outfits" component={OutfitsFeed} />
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenItem: {
    width: width,
    height: CONTENT_HEIGHT,
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%', // Increased height for gradient
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  itemInfo: {
    flex: 1,
    marginBottom: 10,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  itemSubtitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  interactionBar: {
    alignItems: 'center',
    marginLeft: 20,
  },
  interactionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  interactionText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  tabLabel: {
    textTransform: 'none',
    fontWeight: '600',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    flexGrow: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT + SAFE_AREA_BOTTOM,
  },
}); 