import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Alert, Modal, Pressable } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/AppHeader'
import { decode } from 'base64-arraybuffer'

type Point = {
  x: number
  y: number
  number: number
  clothingItem?: {
    id: number
    title: string
    brand: string
  }
}

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadType, setUploadType] = useState<'outfit' | 'clothes' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState<Point[]>([])
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const imageRef = useRef<View>(null)
  
  const { session, userRole, brandInfo } = useAuth()

  const pickImage = async () => {
    if (uploadType === 'clothes') return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      // Reset points when new image is selected
      setPoints([])
    }
  }

  const handleImagePress = async (event: any) => {
    if (uploadType !== 'outfit' || !image) return

    // Get image dimensions and position
    const { locationX, locationY } = event.nativeEvent
    const pointNumber = points.length + 1

    const newPoint: Point = {
      x: locationX,
      y: locationY,
      number: pointNumber
    }

    setPoints([...points, newPoint])
    setSelectedPoint(newPoint)
    
    // Fetch available clothing items
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('id, title, brand')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvailableItems(data)
      setShowItemSelector(true)
    } catch (error) {
      console.error('Error fetching clothing items:', error)
      Alert.alert('Error', 'Failed to load clothing items')
    }
  }

  const handleItemSelect = (item: any) => {
    if (!selectedPoint) return

    const updatedPoints = points.map(point => {
      if (point.number === selectedPoint.number) {
        return { ...point, clothingItem: item }
      }
      return point
    })

    setPoints(updatedPoints)
    setShowItemSelector(false)
    setSelectedPoint(null)
  }

  const handleUpload = async () => {
    if (!session?.user || !title) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    if (uploadType === 'outfit' && (!image || points.length === 0)) {
      Alert.alert('Missing Information', 'Please select an image and add at least one item point')
      return
    }

    if (uploadType === 'clothes' && !imageUrl) {
      Alert.alert('Missing Information', 'Please provide an image URL')
      return
    }

    try {
      setLoading(true)

      let finalImageUrl = imageUrl

      if (uploadType === 'outfit') {
        // Upload image to storage only for outfits
        const uploadWithTimeout = async () => {
          const imageResponse = await fetch(image!)
          const imageBlob = await imageResponse.blob()
          
          if (imageBlob.size > 5000000) { // 5MB limit
            Alert.alert('Error', 'Image size too large. Please choose a smaller image.')
            return null
          }

          const reader = new FileReader()
          
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Upload timed out'))
            }, 30000) // 30 second timeout

            reader.onload = async () => {
              try {
                const base64 = reader.result?.toString().split(',')[1]
                if (!base64) throw new Error('Failed to convert image')

                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
                const filePath = `${uploadType}/${fileName}.jpg`
                
                const { data, error } = await supabase.storage
                  .from('outfit-images')
                  .upload(filePath, decode(base64), {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                  })

                if (error) throw error

                // Get the signed URL that expires in 7 days
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                  .from('outfit-images')
                  .createSignedUrl(filePath, 7 * 24 * 60 * 60) // 7 days in seconds

                if (signedUrlError) throw signedUrlError

                resolve(signedUrlData.signedUrl)
              } catch (error) {
                clearTimeout(timeout)
                reject(error)
              }
            }

            reader.onerror = () => {
              clearTimeout(timeout)
              reject(new Error('Failed to read file'))
            }

            reader.readAsDataURL(imageBlob)
          })
        }

        finalImageUrl = await uploadWithTimeout() as string
        if (!finalImageUrl) return
      }

      // Insert data into appropriate table
      if (uploadType === 'clothes') {
        const { error: insertError } = await supabase
          .from('clothing_items')
          .insert({
            user_id: session.user.id,
            title,
            description,
            brand,
            category,
            image_url: finalImageUrl,
            likes_count: 0,
            created_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      } else {
        // First insert the outfit post
        const { data: outfitData, error: outfitError } = await supabase
          .from('outfit_posts')
          .insert({
            user_id: session.user.id,
            title,
            description,
            image_url: finalImageUrl,
            likes_count: 0,
            created_at: new Date().toISOString()
          })
          .select()

        if (outfitError) throw outfitError

        // Then insert the outfit points
        const outfitId = outfitData[0].id
        const pointsData = points.map(point => ({
          outfit_id: outfitId,
          clothing_item_id: point.clothingItem?.id,
          x_position: point.x,
          y_position: point.y,
          point_number: point.number
        }))

        const { error: pointsError } = await supabase
          .from('outfit_points')
          .insert(pointsData)

        if (pointsError) throw pointsError
      }

      // Success
      Alert.alert('Success', 'Your item has been uploaded!')
      // Reset form
      setImage(null)
      setImageUrl('')
      setTitle('')
      setDescription('')
      setBrand('')
      setCategory('')
      setUploadType(null)
      setPoints([])

    } catch (error: any) {
      console.error('Upload error:', error)
      Alert.alert(
        'Upload Failed', 
        error.message === 'Upload timed out' 
          ? 'Upload took too long. Please try again with a smaller image.'
          : 'Failed to upload. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Add this function to check permissions
  const canUploadType = (type: 'outfit' | 'clothes') => {
    if (type === 'clothes') {
      return userRole === 'brand_admin'
    }
    return true // Both users and brands can upload outfits
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Upload" showNotifications={false} />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Upload</Text>
        
        {userRole === 'brand_admin' && brandInfo && (
          <View style={styles.brandInfo}>
            <Text style={styles.brandName}>{brandInfo.name}</Text>
            <Text style={styles.brandRole}>Brand Administrator</Text>
          </View>
        )}
        
        <View style={styles.typeSelector}>
          {userRole === 'brand_admin' && (
            <TouchableOpacity 
              style={[
                styles.typeButton, 
                uploadType === 'clothes' && styles.selectedTypeButton
              ]}
              onPress={() => setUploadType('clothes')}
            >
              <Ionicons 
                name="shirt-outline" 
                size={24} 
                color={uploadType === 'clothes' ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.typeButtonText,
                uploadType === 'clothes' && styles.selectedTypeButtonText
              ]}>
                Clothing Item
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              uploadType === 'outfit' && styles.selectedTypeButton,
              userRole === 'brand_admin' && { flex: 1 }
            ]}
            onPress={() => setUploadType('outfit')}
          >
            <Ionicons 
              name="people-outline" 
              size={24} 
              color={uploadType === 'outfit' ? '#fff' : '#000'} 
            />
            <Text style={[
              styles.typeButtonText,
              uploadType === 'outfit' && styles.selectedTypeButtonText
            ]}>
              Complete Outfit
            </Text>
          </TouchableOpacity>
        </View>
        
        {uploadType === 'outfit' ? (
          <TouchableOpacity 
            style={styles.imageSelector} 
            onPress={image ? undefined : pickImage}
            ref={imageRef}
          >
            {image ? (
              <Pressable onPress={handleImagePress} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                {points.map((point, index) => (
                  <View
                    key={index}
                    style={[
                      styles.point,
                      {
                        left: point.x - 12,
                        top: point.y - 12,
                      }
                    ]}
                  >
                    <Text style={styles.pointNumber}>{point.number}</Text>
                  </View>
                ))}
                <Text style={styles.tapInstructions}>
                  Tap on the image to add item points
                </Text>
              </Pressable>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#666" />
                <Text style={styles.imagePlaceholderText}>Tap to select an image</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : uploadType === 'clothes' ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Image URL *</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Enter the image URL"
              autoCapitalize="none"
            />
          </View>
        ) : null}
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title"
          />
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item"
            multiline
            numberOfLines={4}
          />
          
          {uploadType === 'clothes' && (
            <>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="Enter brand name"
              />
              
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Tops, Pants, Shoes"
              />
            </>
          )}

          {uploadType === 'outfit' && points.length > 0 && (
            <View style={styles.pointsList}>
              <Text style={styles.pointsTitle}>Tagged Items:</Text>
              {points.map((point, index) => (
                <View key={index} style={styles.pointItem}>
                  <Text style={styles.pointItemNumber}>{point.number}.</Text>
                  <Text style={styles.pointItemText}>
                    {point.clothingItem 
                      ? `${point.clothingItem.title} by ${point.clothingItem.brand}`
                      : 'Item not selected'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              loading && styles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>
              {loading ? 'Uploading...' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showItemSelector}
        onRequestClose={() => setShowItemSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Clothing Item</Text>
            <ScrollView style={styles.itemList}>
              {availableItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemOption}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={styles.itemOptionTitle}>{item.title}</Text>
                  <Text style={styles.itemOptionBrand}>{item.brand}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowItemSelector(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginRight: 10,
  },
  selectedTypeButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  typeButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  imageSelector: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  point: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pointNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tapInstructions: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    fontSize: 14,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#666',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#666',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  brandInfo: {
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  brandRole: {
    fontSize: 16,
    color: '#666',
  },
  pointsList: {
    marginTop: 20,
    marginBottom: 20,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  pointItemText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemList: {
    maxHeight: 400,
  },
  itemOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemOptionBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
}); 