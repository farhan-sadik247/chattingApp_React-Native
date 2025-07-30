import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface RegisterScreenProps {
  navigation: any;
}

// Password strength types
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: '',
    color: '#E0E0E0',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    }
  });
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const { register } = useAuth();

  // Animation values
  const strengthBarWidth = new Animated.Value(0);
  const matchIndicatorOpacity = new Animated.Value(0);

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = '';
    let color = '#E0E0E0';

    if (pwd.length === 0) {
      score = 0;
      label = '';
      color = '#E0E0E0';
    } else if (metRequirements <= 1) {
      score = 1;
      label = 'Very Weak';
      color = '#FF4444';
    } else if (metRequirements === 2) {
      score = 2;
      label = 'Weak';
      color = '#FF8800';
    } else if (metRequirements === 3) {
      score = 3;
      label = 'Fair';
      color = '#FFBB00';
    } else if (metRequirements === 4) {
      score = 4;
      label = 'Good';
      color = '#88CC00';
    } else if (metRequirements === 5) {
      score = 5;
      label = 'Strong';
      color = '#00AA00';
    }

    return { score, label, color, requirements };
  };

  // Check if passwords match
  const checkPasswordsMatch = (pwd: string, confirmPwd: string): boolean | null => {
    if (confirmPwd.length === 0) return null;
    return pwd === confirmPwd;
  };

  // Update password strength when password changes
  useEffect(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);

    // Animate strength bar
    Animated.timing(strengthBarWidth, {
      toValue: (strength.score / 5) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [password]);

  // Update password match when either password changes
  useEffect(() => {
    const match = checkPasswordsMatch(password, confirmPassword);
    setPasswordsMatch(match);

    // Animate match indicator
    if (match !== null) {
      Animated.timing(matchIndicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(matchIndicatorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [password, confirmPassword]);

  const validateForm = () => {
    if (!email.trim() || !password.trim() || !username.trim() || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Check password strength requirements
    if (passwordStrength.score < 3) {
      Alert.alert('Weak Password', 'Please choose a stronger password. Your password should include uppercase letters, lowercase letters, numbers, and special characters.');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await register(email.trim(), password, username.trim(), displayName.trim());
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Watermark Image */}
      <Image
        source={require('../../../assets/signin.png')}
        style={styles.watermarkImage}
        resizeMode="contain"
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the conversation</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.strengthBarContainer}>
                <View style={styles.strengthBarBackground}>
                  <Animated.View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: strengthBarWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>

              <View style={styles.requirementsContainer}>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={passwordStrength.requirements.length ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordStrength.requirements.length ? '#00AA00' : '#CCC'}
                  />
                  <Text style={[styles.requirementText, passwordStrength.requirements.length && styles.requirementMet]}>
                    At least 8 characters
                  </Text>
                </View>

                <View style={styles.requirementRow}>
                  <Ionicons
                    name={passwordStrength.requirements.uppercase ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordStrength.requirements.uppercase ? '#00AA00' : '#CCC'}
                  />
                  <Text style={[styles.requirementText, passwordStrength.requirements.uppercase && styles.requirementMet]}>
                    Uppercase letter
                  </Text>
                </View>

                <View style={styles.requirementRow}>
                  <Ionicons
                    name={passwordStrength.requirements.lowercase ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordStrength.requirements.lowercase ? '#00AA00' : '#CCC'}
                  />
                  <Text style={[styles.requirementText, passwordStrength.requirements.lowercase && styles.requirementMet]}>
                    Lowercase letter
                  </Text>
                </View>

                <View style={styles.requirementRow}>
                  <Ionicons
                    name={passwordStrength.requirements.number ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordStrength.requirements.number ? '#00AA00' : '#CCC'}
                  />
                  <Text style={[styles.requirementText, passwordStrength.requirements.number && styles.requirementMet]}>
                    Number
                  </Text>
                </View>

                <View style={styles.requirementRow}>
                  <Ionicons
                    name={passwordStrength.requirements.special ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordStrength.requirements.special ? '#00AA00' : '#CCC'}
                  />
                  <Text style={[styles.requirementText, passwordStrength.requirements.special && styles.requirementMet]}>
                    Special character
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator */}
          <Animated.View
            style={[
              styles.passwordMatchContainer,
              { opacity: matchIndicatorOpacity }
            ]}
          >
            {passwordsMatch !== null && (
              <View style={styles.matchIndicator}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={passwordsMatch ? '#00AA00' : '#FF4444'}
                />
                <Text style={[
                  styles.matchText,
                  { color: passwordsMatch ? '#00AA00' : '#FF4444' }
                ]}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.registerButtonText, { marginLeft: 8 }]}>
                  Creating Account...
                </Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  watermarkImage: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.45,
    opacity: 0.05,
    zIndex: 0,
    transform: [
      { translateX: -Dimensions.get('window').width * 0.3 },
      { translateY: -Dimensions.get('window').width * 0.225 },
      { rotate: '-10deg' }
    ],
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Password Strength Styles
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  requirementMet: {
    color: '#00AA00',
    fontWeight: '500',
  },
  // Password Match Styles
  passwordMatchContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
