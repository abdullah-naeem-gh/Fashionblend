import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { supabase } from '../lib/supabase'

type Filter = 'all' | 'clothes' | 'outfits' | 'brands'

type SearchResult = {
  id: string
  title: string
  image_url: string
  type: 'clothes' | 'outfit' | 'brand'
  subtitle?: string
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'summer outfits', 'black jeans', 'casual shoes'
  ])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    
    try {
      // Save to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5))
      }

      let query = supabase
        .from(activeFilter === 'outfits' ? 'outfits' : 'clothes')
        .select('*')
        .ilike('title', `%${searchQuery}%`)

      if (activeFilter !== 'all' && activeFilter !== 'outfits') {
        query = query.eq('type', activeFilter)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      const formattedResults: SearchResult[] = data.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        type: activeFilter === 'outfits' ? 'outfit' : 'clothes',
        subtitle: item.brand || item.creator || undefined,
      }))

      setResults(formattedResults)
    } catch (error) {
      console.error('Search error:', error)
      Alert.alert('Error', 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem}>
      <Image source={{ uri: item.image_url }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.resultSubtitle}>{item.subtitle}</Text>}
        <View style={styles.resultTypeContainer}>
          <Text style={styles.resultType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <AppHeader title="Search" showNotifications={false} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clothes, outfits, brands..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'clothes' && styles.activeFilterButton]}
              onPress={() => setActiveFilter('clothes')}
            >
              <Text style={[styles.filterText, activeFilter === 'clothes' && styles.activeFilterText]}>
                Clothes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'outfits' && styles.activeFilterButton]}
              onPress={() => setActiveFilter('outfits')}
            >
              <Text style={[styles.filterText, activeFilter === 'outfits' && styles.activeFilterText]}>
                Outfits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'brands' && styles.activeFilterButton]}
              onPress={() => setActiveFilter('brands')}
            >
              <Text style={[styles.filterText, activeFilter === 'brands' && styles.activeFilterText]}>
                Brands
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
        />
      ) : (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
          {recentSearches.map((search, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recentSearchItem}
              onPress={() => {
                setSearchQuery(search)
                handleSearch()
              }}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.recentSearchText}>{search}</Text>
            </TouchableOpacity>
          ))}
          
          <Text style={styles.recentSearchesTitle}>Popular Categories</Text>
          <View style={styles.categoriesContainer}>
            <TouchableOpacity style={styles.categoryItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.categoryImage} />
              <Text style={styles.categoryText}>Summer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.categoryImage} />
              <Text style={styles.categoryText}>Casual</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.categoryImage} />
              <Text style={styles.categoryText}>Formal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.categoryImage} />
              <Text style={styles.categoryText}>Streetwear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginTop: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#000',
  },
  filterText: {
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultsList: {
    padding: 15,
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultImage: {
    width: 80,
    height: 80,
  },
  resultInfo: {
    flex: 1,
    padding: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultTypeContainer: {
    marginTop: 5,
  },
  resultType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  recentSearchesContainer: {
    padding: 15,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentSearchText: {
    marginLeft: 10,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryItem: {
    width: '48%',
    marginBottom: 15,
  },
  categoryImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  categoryText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}) 