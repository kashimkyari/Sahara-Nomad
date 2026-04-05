import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import API from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

interface Address {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
  selectedId?: string;
  type: 'pickup' | 'dropoff';
}

const AddressSelector = ({ onSelect, selectedId, type }: AddressSelectorProps) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API.API_URL}/auth/addresses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setAddresses(data);
        }
      } catch (error) {
        console.error("Fetch Addresses Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [token]);

  if (loading) return <ActivityIndicator size="small" color={colors.text} style={{ marginVertical: 10 }} />;
  if (addresses.length === 0) return null;

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAVED {type.toUpperCase()}S</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {addresses.map((item, index) => (
          <MotiView
            key={item.id}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: index * 100 }}
          >
            <TouchableOpacity 
              onPress={() => onSelect(item)}
              style={[
                styles.card, 
                selectedId === item.id && styles.selectedCard
              ]}
            >
              <Ionicons 
                name={item.label?.toLowerCase() === 'home' ? 'home' : 'business'} 
                size={18} 
                color={selectedId === item.id ? colors.surface : colors.text} 
              />
              <Text style={[styles.label, selectedId === item.id && styles.selectedText]}>
                {item.label?.toUpperCase() || "ADDRESS"}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginVertical: DT.spacing.md,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    marginBottom: 8,
    color: colors.muted,
    letterSpacing: 1,
  },
  scroll: {
    paddingRight: DT.spacing.lg,
    gap: DT.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: DT.border.width,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    ...DT.shadow.hard,
  },
  selectedCard: {
    backgroundColor: colors.text,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  label: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
  },
  selectedText: {
    color: colors.surface,
  }
});

export default AddressSelector;
