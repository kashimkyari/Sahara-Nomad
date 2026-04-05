import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, ChevronRight, Star, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import API from '../constants/api';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';

const FavoritesScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API.API_URL}/runners/bookmarks/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error("Fetch Favorites Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const renderRunner = ({ item, index }: { item: any, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
      style={styles.card}
    >
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => router.push(`/runner/${item.id}`)}
      >
        <View style={styles.avatarBox}>
          <Image 
            source={item.avatar_url 
              ? { uri: `${API.API_URL}${item.avatar_url}`, headers: { Authorization: `Bearer ${token}` } }
              : { uri: `https://i.pravatar.cc/150?u=${item.id}` }
            }
            style={styles.avatar}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Star size={12} color={colors.accent} fill={colors.accent} />
              <Text style={styles.statText}>{item.stats_rating || '5.0'}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.primary }]}>
                <Zap size={12} color={colors.surface} />
                <Text style={[styles.statText, { color: colors.surface }]}>{item.runner_tier || 'Bronze'}</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color={colors.muted} strokeWidth={2.5} />
      </TouchableOpacity>
    </MotiView>
  );

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Runners</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : favorites.length === 0 ? (
        <ScrollView contentContainerStyle={styles.center}>
          <View style={styles.emptyBox}>
              <Heart size={64} color={colors.muted} strokeWidth={1} />
              <Text style={styles.emptyText}>You haven't bookmarked any runners yet.</Text>
              <TouchableOpacity 
                style={styles.browseBtn}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Text style={styles.browseBtnText}>Browse Runners</Text>
              </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList 
          data={favorites}
          renderItem={renderRunner}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: DT.spacing.lg, 
    paddingVertical: DT.spacing.md, 
    borderBottomWidth: 2, 
    borderBottomColor: colors.text 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderWidth: 2, 
    borderColor: colors.text, 
    backgroundColor: colors.surface, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DT.spacing.xl,
  },
  list: {
    padding: DT.spacing.lg,
    paddingBottom: 40,
    gap: DT.spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DT.spacing.md,
    gap: 16,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: colors.text,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  avatar: { width: '100%', height: '100%' },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  statText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
  },
  emptyBox: { 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: colors.text, 
    borderStyle: 'dashed', 
    padding: DT.spacing.xl,
    backgroundColor: colors.surface,
  },
  emptyText: { 
    fontFamily: DT.typography.body, 
    color: colors.muted, 
    textAlign: 'center', 
    marginTop: 16,
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  browseBtnText: {
    color: colors.surface,
    fontFamily: DT.typography.heading,
    fontSize: 14,
  }
});

export default FavoritesScreen;
