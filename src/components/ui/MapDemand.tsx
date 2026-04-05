import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import MapView, { Circle, Heatmap, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import API from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

export default function MapDemand() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [points, setPoints] = useState<{latitude: number, longitude: number, weight: number}[]>([]);
  const [runners, setRunners] = useState<{latitude: number, longitude: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultRegion = useMemo(() => ({
    latitude: user?.latitude ?? 6.5244,
    longitude: user?.longitude ?? 3.3792,
    latitudeDelta: 0.27,
    longitudeDelta: 0.27,
  }), [user?.latitude, user?.longitude]);

  const hotspotOverlays = useMemo(() => {
    return points.slice(0, 3).map((point, index) => {
      const labels = ['HOT ZONE', 'BUSY POCKET', 'ACTIVE AREA'];
      const runnerCount = runners.filter((runner) => {
        const latDiff = Math.abs(runner.latitude - point.latitude);
        const lngDiff = Math.abs(runner.longitude - point.longitude);
        return latDiff < 0.02 && lngDiff < 0.02;
      }).length;

      return {
        ...point,
        id: `overlay-${index}`,
        title: labels[index] || 'DEMAND',
        subtitle: runnerCount > 0 ? `${runnerCount} runners nearby` : 'Low runner coverage',
      };
    });
  }, [points, runners]);

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

  useEffect(() => {
    if (user?.latitude != null && user?.longitude != null) return;

    const coordinates = [
      ...points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
      ...runners,
    ];

    if (!mapRef.current || coordinates.length === 0) return;

    const timeoutId = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 32, right: 32, bottom: 32, left: 32 },
        animated: true,
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [points, runners, user?.latitude, user?.longitude]);

  useEffect(() => {
    if (!mapRef.current || user?.latitude == null || user?.longitude == null) return;

    const timeoutId = setTimeout(() => {
      mapRef.current?.animateToRegion(defaultRegion, 350);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [defaultRegion, user?.latitude, user?.longitude]);

  return (
    <View style={[styles.container, { borderColor: colors.text }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ fontFamily: DT.typography.heading, color: colors.text, marginTop: 8 }}>RADAR SCANNING...</Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={defaultRegion}
        customMapStyle={mapStyle} // reuse brutalist style
      >
        {Platform.OS === 'android' && points.length > 0 && (
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
        {Platform.OS !== 'android' && points.map((point, index) => (
          <React.Fragment key={`heat-${index}`}>
            <Circle
              center={{ latitude: point.latitude, longitude: point.longitude }}
              radius={2200}
              fillColor="rgba(255, 59, 48, 0.12)"
              strokeWidth={0}
            />
            <Circle
              center={{ latitude: point.latitude, longitude: point.longitude }}
              radius={1200}
              fillColor="rgba(255, 159, 10, 0.18)"
              strokeWidth={0}
            />
            <Circle
              center={{ latitude: point.latitude, longitude: point.longitude }}
              radius={550}
              fillColor="rgba(255, 204, 0, 0.26)"
              strokeWidth={0}
            />
          </React.Fragment>
        ))}
        {runners.map((runner, index) => (
          <Marker
            key={`runner-${index}`}
            coordinate={{ latitude: runner.latitude, longitude: runner.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.runnerMarker, { backgroundColor: colors.secondary, borderColor: colors.surface }]} />
          </Marker>
        ))}
        {user?.latitude != null && user?.longitude != null && (
          <Marker
            coordinate={{ latitude: user.latitude, longitude: user.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.employerMarkerOuter, { borderColor: colors.text }]}>
              <View style={[styles.employerMarkerInner, { backgroundColor: colors.primary }]} />
            </View>
          </Marker>
        )}
        {hotspotOverlays.map((overlay) => (
          <Marker
            key={overlay.id}
            coordinate={{ latitude: overlay.latitude, longitude: overlay.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.overlayCard, { backgroundColor: colors.surface, borderColor: colors.text, shadowColor: colors.text }]}>
              <Text style={[styles.overlayTitle, { color: colors.text }]}>{overlay.title}</Text>
              <Text style={[styles.overlaySubtitle, { color: colors.muted }]}>{overlay.subtitle}</Text>
            </View>
            <View style={[styles.overlayStem, { backgroundColor: colors.accent, borderColor: colors.text }]} />
          </Marker>
        ))}
      </MapView>
      {!loading && points.length === 0 && runners.length === 0 && (
        <View style={styles.emptyState} pointerEvents="none">
          <Text style={[styles.emptyTitle, { color: colors.text }]}>NO LIVE MAP DATA YET</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Demand zones and coverage insight will appear here.</Text>
        </View>
      )}
      <View style={[styles.legend, { backgroundColor: colors.surface, borderColor: colors.text }]}>
        <View style={styles.legendColor} />
        <Text style={[styles.legendText, { color: colors.text }]}>RUNNER COVERAGE & DEMAND</Text>
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
  emptyState: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  emptyTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  emptyText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
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
  },
  overlayCard: {
    minWidth: 104,
    maxWidth: 132,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    alignItems: 'flex-start',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  overlayTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    letterSpacing: 1,
  },
  overlaySubtitle: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    marginTop: 2,
  },
  overlayStem: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    alignSelf: 'center',
    marginTop: -6,
  },
  runnerMarker: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
  },
  employerMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employerMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
