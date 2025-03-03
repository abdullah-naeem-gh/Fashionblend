import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/AppHeader'
import { decode } from 'base64-arraybuffer'

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadType, setUploadType] = useState<'outfit' | 'clothes' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { session, userRole, brandInfo } = useAuth()

  const pickImage = async () => {
    if (uploadType === 'clothes') return // Disable image picker for clothes

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const handleUpload = async () => {
    if (!session?.user || !title) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    if (uploadType === 'clothes' && !imageUrl) {
      Alert.alert('Missing Information', 'Please provide an image URL')
      return
    }

    if (uploadType === 'outfit' && !image) {
      Alert.alert('Missing Information', 'Please select an image')
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
        const { error: insertError } = await supabase
          .from('outfit_posts')
          .insert({
            user_id: session.user.id,
            title,
            description,
            image_url: finalImageUrl,
            likes_count: 0,
            created_at: new Date().toISOString()
          })

        if (insertError) throw insertError
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
          <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedImage} />
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
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
}); 