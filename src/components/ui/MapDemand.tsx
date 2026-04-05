import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import API from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

export default function MapDemand() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [points, setPoints] = useState<{latitude: number, longitude: number, weight: number}[]>([]);
  const [runners, setRunners] = useState<{latitude: number, longitude: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API.API_URL}/search/heatmap`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          const heatmapPts: {latitude: number, longitude: number, weight: number}[] = [];
          if (data.demand) {
            data.demand.forEach((ptStr: any) => {
              try {
                const pt = typeof ptStr === 'string' ? JSON.parse(ptStr) : ptStr;
                if (pt && pt.coordinates) {
                   heatmapPts.push({
                     longitude: pt.coordinates[0],
                     latitude: pt.coordinates[1],
                     weight: 1
                   });
                }
              } catch (e) {}
            });
          }
          setPoints(heatmapPts);

          const runnerPts: {latitude: number, longitude: number}[] = [];
          if (data.runners) {
            data.runners.forEach((ptStr: any) => {
              try {
                const pt = typeof ptStr === 'string' ? JSON.parse(ptStr) : ptStr;
                if (pt && pt.coordinates) {
                   runnerPts.push({
                     longitude: pt.coordinates[0],
                     latitude: pt.coordinates[1]
                   });
                }
              } catch (e) {}
            });
          }
          setRunners(runnerPts);
        }
      } catch (err) {
        console.error('Heatmap load error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchHeatmap();
    }
  }, [token]);

  return (
    <View style={[styles.container, { borderColor: colors.text }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ fontFamily: DT.typography.heading, color: colors.text, marginTop: 8 }}>RADAR SCANNING...</Text>
        </View>
      )}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 9.0765, // Default Abuja
          longitude: 7.3986,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        customMapStyle={mapStyle} // reuse brutalist style
      >
        {points.length > 0 && (
          <Heatmap
            points={points}
            radius={40}
            opacity={0.8}
            gradient={{
              colors: ['transparent', colors.accent, colors.error],
              startPoints: [0, 0.5, 1],
              colorMapSize: 256
            }}
          />
        )}
        {runners.map((r, i) => (
          <Marker key={`r-${i}`} coordinate={r} flat anchor={{ x: 0.5, y: 0.5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.surface }} />
          </Marker>
        ))}
      </MapView>
      <View style={[styles.legend, { backgroundColor: colors.surface, borderColor: colors.text }]}>
        <View style={styles.legendColor} />
        <Text style={[styles.legendText, { color: colors.text }]}>HIGH DEMAND ZONES</Text>
      </View>
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    backgroundColor: '#FF3B30', // error color equivalent for heatmap hotspot
    borderRadius: 6,
  },
  legendText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
  }
});
