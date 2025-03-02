import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type AppHeaderProps = {
  title: string
  showBackButton?: boolean
  showNotifications?: boolean
  showSearch?: boolean
  onBackPress?: () => void
}

export default function AppHeader({
  title,
  showBackButton = false,
  showNotifications = true,
  showSearch = true,
  onBackPress
}: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.headerButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerLeft} />
        )}
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <View style={styles.headerRight}>
          {showNotifications && (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
          )}
          {showSearch && (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
}) 