import { NativeStackNavigationProp } from "@react-navigation/native-stack"

export type AuthStackParamList = {
  Welcome: undefined
  SignIn: undefined
  SignUp: undefined
  PreferenceSetup: undefined
}

export type MainTabParamList = {
  Home: undefined
  Search: undefined
  Upload: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type AuthScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>
export type RootScreenNavigationProp = NativeStackNavigationProp<RootStackParamList> 