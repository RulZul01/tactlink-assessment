import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const GRAPHQL_URI = 'http://localhost:4000/'; 

async function fetchGraphQL(query, variables = {}) {
  const res = await fetch(GRAPHQL_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const appContent = (
    <View style={{ flex: 1, backgroundColor: 'transparent', width: '100%', height: '100%' }}>
      {Platform.OS !== 'web' && <StatusBar barStyle="dark-content" backgroundColor="transparent" />}
      {currentUser ? (
        <HomeScreen user={currentUser} onLogout={() => setCurrentUser(null)} fetchGraphQL={fetchGraphQL} />
      ) : (
        <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} fetchGraphQL={fetchGraphQL} />
      )}
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        <View style={styles.iphonePhoneCase}>
          {/* Edge-to-Edge Screen View */}
          <View style={styles.iphoneScreen}>
            {appContent}

            {/* Hardware Dynamic Island Cutout (Always on top layer) */}
            <View style={styles.dynamicIsland}>
              <View style={styles.islandCameraLens} />
              <View style={styles.islandSensorLens} />
            </View>

            {/* iOS Home Indicator Bar */}
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    );
  }

  return appContent;
}

const styles = StyleSheet.create({
  webWrapper: { 
    flex: 1, 
    backgroundColor: '#070a12', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh', 
    width: '100vw', 
    paddingVertical: 12 
  },
  
  // Clean iPhone Chassis matching pure black OLED
  iphonePhoneCase: { 
    width: 372, 
    height: 746, 
    backgroundColor: '#000000', 
    borderRadius: 52, 
    padding: 5, // Tighter padding eliminates edge artifacts
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 35 }, 
    shadowOpacity: 0.85, 
    shadowRadius: 45, 
    elevation: 25, 
    borderWidth: 2, 
    borderColor: '#222225', 
    position: 'relative', 
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Flawless Edge-to-Edge Screen Canvas
  iphoneScreen: { 
    flex: 1, 
    width: '100%', 
    height: '100%',
    backgroundColor: '#f2f2f7', 
    borderRadius: 48, // Seamless match
    overflow: 'hidden', 
    position: 'relative',
  },

  // Fixed Hardware Dynamic Island Notch Layer (z-index ensures it's always above content)
  dynamicIsland: { 
    position: 'absolute', 
    top: 8, 
    alignSelf: 'center',
    width: 96, 
    height: 26, 
    backgroundColor: '#000000', 
    borderRadius: 14, 
    zIndex: 99999, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    paddingRight: 10,
    gap: 6,
  },
  islandCameraLens: { 
    width: 9, 
    height: 9, 
    backgroundColor: '#121215', 
    borderRadius: 4.5,
  },
  islandSensorLens: {
    width: 5,
    height: 5,
    backgroundColor: '#0a0a0c',
    borderRadius: 2.5,
  },

  homeIndicator: { 
    position: 'absolute', 
    bottom: 5, 
    alignSelf: 'center',
    width: 120, 
    height: 4, 
    backgroundColor: '#000000', 
    borderRadius: 2, 
    zIndex: 99999,
    opacity: 0.8,
  },
});