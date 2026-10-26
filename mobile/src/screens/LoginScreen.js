import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

export default function LoginScreen({ onLoginSuccess, fetchGraphQL }) {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [showFaceIDModal, setShowFaceIDModal] = useState(false);
  const [faceIDStatus, setFaceIDStatus] = useState('scanning'); // 'scanning' | 'success'
  
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const triggerFaceIDAuth = () => {
    setShowFaceIDModal(true);
    setFaceIDStatus('scanning');
    
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setFaceIDStatus('success');

      setTimeout(async () => {
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          setShowFaceIDModal(false);
          executeBackendLogin();
        });
      }, 750);
    }, 1100);
  };

  const handleLoginPress = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setErrorMsg('');
    triggerFaceIDAuth();
  };

  const executeBackendLogin = async () => {
    setLoading(true);
    try {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            id
            email
          }
        }
      `;
      const data = await fetchGraphQL(mutation, { email, password });
      if (data?.login) {
        onLoginSuccess(data.login);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = () => {
    if (!forgotEmail.trim()) {
      setForgotMsg('Please enter a valid email.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setForgotMsg(`Mock Code Sent! Use: ${code}`);
    setForgotStep(2);
  };

  const handleVerifyCode = () => {
    if (inputCode.trim() === generatedCode) {
      setForgotStep(3);
      setForgotMsg('Password reset verified!');
    } else {
      setForgotMsg('Invalid code. Please try again.');
    }
  };

  const resetForgotState = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setInputCode('');
    setForgotMsg('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.innerContainer}
      >
        <View style={styles.contentBox}>
          <View style={styles.appIconContainer}>
            <Text style={styles.appIconGlyph}>✓</Text>
          </View>

          <Text style={styles.appleTitle}>Sign In</Text>
          <Text style={styles.appleSubtitle}>Use your credentials to access Reminders</Text>

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.groupedInputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email Address"
                placeholderTextColor="#8e8e93"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                placeholderTextColor="#8e8e93"
              />
              <TouchableOpacity 
                style={styles.toggleBtn} 
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
            onPress={handleLoginPress} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowForgotModal(true)}>
            <Text style={styles.footerHelpText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.demoNoteBox}>
            <Text style={styles.demoNoteTitle}>💡 Interview Demo Note</Text>
            <Text style={styles.demoNoteText}>Email: test@test.com</Text>
            <Text style={styles.demoNoteText}>Password: password123</Text>
          </View>
        </View>

        {/* Face ID HUD Overlay */}
        {showFaceIDModal && (
          <View style={styles.faceIdOverlay}>
            <Animated.View style={[styles.faceIdHudCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.faceIdFrameBox}>
                {faceIDStatus === 'scanning' ? (
                  <>
                    <View style={[styles.cornerBracket, styles.topLeftCorner]} />
                    <View style={[styles.cornerBracket, styles.topRightCorner]} />
                    <View style={[styles.cornerBracket, styles.bottomLeftCorner]} />
                    <View style={[styles.cornerBracket, styles.bottomRightCorner]} />

                    <View style={styles.faceFeaturesRow}>
                      <View style={styles.featureEye} />
                      <View style={styles.featureEye} />
                    </View>
                    <View style={styles.featureNose} />
                    <View style={styles.featureSmile} />
                  </>
                ) : (
                  <View style={styles.successCheckCircle}>
                    <View style={styles.nativeCheckmark} />
                  </View>
                )}
              </View>

              <Text style={styles.faceIdTitleText}>
                {faceIDStatus === 'scanning' ? 'Face ID' : 'Verified'}
              </Text>
              <Text style={styles.faceIdSubText}>
                {faceIDStatus === 'scanning' ? 'Authenticating...' : 'Access Granted'}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* Reset Password Overlay */}
        {showForgotModal && (
          <View style={styles.inFrameOverlay}>
            <View style={styles.forgotCard}>
              <Text style={styles.forgotModalTitle}>Reset Password</Text>
              
              {!!forgotMsg && (
                <View style={styles.forgotAlertBox}>
                  <Text style={styles.forgotAlertText}>{forgotMsg}</Text>
                </View>
              )}

              {forgotStep === 1 && (
                <>
                  <Text style={styles.forgotDesc}>Enter your account email to receive a 6-digit code.</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#8e8e93"
                  />
                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSendResetCode}>
                    <Text style={styles.modalBtnText}>Send Code</Text>
                  </TouchableOpacity>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <Text style={styles.forgotDesc}>Enter the 6-digit verification code sent to your email.</Text>
                  <TextInput
                    style={[styles.modalInput, { letterSpacing: 4, textAlign: 'center', fontSize: 15 }]}
                    placeholder="000000"
                    value={inputCode}
                    onChangeText={setInputCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#8e8e93"
                  />
                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleVerifyCode}>
                    <Text style={styles.modalBtnText}>Verify Code</Text>
                  </TouchableOpacity>
                </>
              )}

              {forgotStep === 3 && (
                <>
                  <Text style={styles.forgotDesc}>Your password reset link has been verified! You may now return to sign in.</Text>
                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={resetForgotState}>
                    <Text style={styles.modalBtnText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </>
              )}

              {forgotStep !== 3 && (
                <TouchableOpacity onPress={resetForgotState} style={{ marginTop: 12 }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, position: 'relative' },
  contentBox: { alignItems: 'center', width: '100%' },
  appIconContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#007aff', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#007aff', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  appIconGlyph: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  appleTitle: { fontSize: 26, fontWeight: '800', color: '#000000', letterSpacing: -0.5, textAlign: 'center' },
  appleSubtitle: { fontSize: 12, color: '#8e8e93', textAlign: 'center', marginTop: 4, marginBottom: 24, fontWeight: '400' },
  errorBanner: { backgroundColor: 'rgba(255, 59, 48, 0.12)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 16, width: '100%' },
  errorText: { color: '#ff3b30', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  groupedInputContainer: { width: '100%', backgroundColor: '#ffffff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 14 },
  textInput: { flex: 1, fontSize: 13, color: '#000000', ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }) },
  toggleBtn: { paddingLeft: 8 },
  toggleText: { fontSize: 12, color: '#007aff', fontWeight: '600' },
  primaryButton: { width: '100%', backgroundColor: '#007aff', height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#007aff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  footerHelpText: { marginTop: 14, fontSize: 11, color: '#007aff', fontWeight: '500' },
  demoNoteBox: { marginTop: 22, backgroundColor: 'rgba(0, 122, 255, 0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, width: '100%', borderWidth: 1, borderColor: 'rgba(0, 122, 255, 0.15)' },
  demoNoteTitle: { fontSize: 11, fontWeight: '700', color: '#007aff', marginBottom: 2 },
  demoNoteText: { fontSize: 10, color: '#3a3a3c', fontWeight: '500' },

  faceIdOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', borderRadius: 36, zIndex: 9999 },
  faceIdHudCard: { width: 175, height: 175, backgroundColor: 'rgba(30, 30, 30, 0.92)', borderRadius: 28, alignItems: 'center', justifyContent: 'center', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
  faceIdFrameBox: { width: 60, height: 60, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cornerBracket: { position: 'absolute', width: 14, height: 14, borderColor: '#007aff' },
  topLeftCorner: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  topRightCorner: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bottomLeftCorner: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  bottomRightCorner: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  faceFeaturesRow: { flexDirection: 'row', gap: 18, marginTop: 10 },
  featureEye: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#007aff' },
  featureNose: { width: 3, height: 10, backgroundColor: '#007aff', borderRadius: 2, marginTop: 4 },
  featureSmile: { width: 22, height: 8, borderWidth: 2.5, borderColor: '#007aff', borderTopWidth: 0, borderRadius: 8, marginTop: 3 },
  
  successCheckCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#34c759', alignItems: 'center', justifyContent: 'center' },
  nativeCheckmark: { width: 12, height: 20, borderColor: '#ffffff', borderBottomWidth: 3.5, borderRightWidth: 3.5, transform: [{ rotate: '45deg' }, { translateY: -2 }] },

  faceIdTitleText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  faceIdSubText: { color: '#8e8e93', fontSize: 10, textAlign: 'center', marginTop: 2 },

  inFrameOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 36, zIndex: 9999 },
  forgotCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12 },
  forgotModalTitle: { fontSize: 17, fontWeight: '700', color: '#000000', marginBottom: 6 },
  forgotDesc: { fontSize: 11, color: '#8e8e93', textAlign: 'center', marginBottom: 14 },
  forgotAlertBox: { backgroundColor: 'rgba(0, 122, 255, 0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 10, width: '100%' },
  forgotAlertText: { color: '#007aff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  modalInput: { width: '100%', backgroundColor: '#f2f2f7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 12, color: '#000000', marginBottom: 12, ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }) },
  modalPrimaryBtn: { width: '100%', backgroundColor: '#007aff', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  cancelText: { color: '#ff3b30', fontSize: 11, fontWeight: '600' },
});