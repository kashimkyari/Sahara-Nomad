import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../hooks/use-theme';

interface Coordinates {
  latitude: number;
  longitude: number;
}

import { ViewStyle } from 'react-native';

interface WakaLiveMapProps {
  runnerLocation?: Coordinates | null;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  showRoute?: boolean;
  containerStyle?: ViewStyle;
}

const WakaLiveMap = ({ runnerLocation, pickupLocation, dropoffLocation, showRoute = true, containerStyle }: WakaLiveMapProps) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      const coords = [pickupLocation, dropoffLocation];
      if (runnerLocation) coords.push(runnerLocation);

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [runnerLocation, pickupLocation, dropoffLocation]);

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={{
          ...pickupLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={mapStyle}
      >
        {/* Pickup Marker */}
        <Marker coordinate={pickupLocation} title="Pickup">
          <View style={[styles.markerBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="location" size={16} color="white" />
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker coordinate={dropoffLocation} title="Dropoff">
          <View style={[styles.markerBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="flag" size={16} color="white" />
          </View>
        </Marker>

        {/* Runner Marker */}
        {runnerLocation && (
          <Marker
            coordinate={runnerLocation}
            title="Runner"
            flat={true}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.runnerMarker}>
              <View style={styles.runnerInner}>
                <Ionicons name="bicycle" size={18} color="white" />
              </View>
              <View style={styles.runnerAura} />
            </View>
          </Marker>
        )}

        {showRoute && (
          <Polyline
            coordinates={[pickupLocation, dropoffLocation]}
            strokeWidth={3}
            strokeColor="black"
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Brutalist Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>LIVE TRACKING ACTIVE</Text>
        <View style={styles.legendDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderWidth: 4,
    borderColor: 'black',
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: 'black',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerBox: {
    padding: 6,
    borderWidth: 2,
    borderColor: 'black',
  },
  runnerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerInner: {
    backgroundColor: 'black',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  runnerAura: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  legend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4500',
  }
});

// Subtle Neo-Brutalist Map Style (Gray-scale and simplified)
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

export default WakaLiveMap;
