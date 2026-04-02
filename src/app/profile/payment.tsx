import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, CreditCard, Plus, Trash2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

const cards = [
  { id: '1', label: 'Kuda Bank', number: '•••• •••• •••• 4521', type: 'Bank Transfer', active: true },
  { id: '2', label: 'GTBank Mastercard', number: '•••• •••• •••• 9873', type: 'Card', active: false },
];

const transactions = [
  { id: '0', label: 'Waka — Mile 12 Run', amount: '-₦2,500', date: 'Today, 12:45', positive: false },
  { id: '1', label: 'Wallet Top-up', amount: '+₦10,000', date: 'Yesterday', positive: true },
  { id: '2', label: 'Waka — Shoprite Lekki', amount: '-₦3,000', date: 'Mon, Apr 31', positive: false },
];

export default function ProfilePaymentScreen() {
  const router = useRouter();

  const handleDelete = (card: typeof cards[number]) => {
    Alert.alert('Remove Payment Method', `Remove ${card.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Wallet */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>SENDAM WALLET</Text>
          <Text style={styles.walletBalance}>₦ 12,400.00</Text>
          <Text style={styles.walletSub}>Available balance</Text>
          <TouchableOpacity style={styles.fundBtn} onPress={() => router.push('/profile/fund-wallet' as any)}>
            <Text style={styles.fundBtnText}>Fund Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Cards */}
        <Text style={styles.sectionLabel}>SAVED CARDS & ACCOUNTS</Text>
        {cards.map((card) => (
          <TouchableOpacity key={card.id} style={styles.cardRow} onPress={() => router.push(`/profile/card/${card.id}` as any)}>
            <View style={[styles.cardIcon, card.active && styles.cardIconActive]}>
              <CreditCard size={20} color={card.active ? DT.colors.surface : DT.colors.text} strokeWidth={2} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardNumber}>{card.number} · {card.type}</Text>
              {card.active && <View style={styles.activePill}><Text style={styles.activePillText}>DEFAULT</Text></View>}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(card)}>
              <Trash2 size={16} color={DT.colors.error} strokeWidth={2} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/profile/add-method' as any)}>
          <Plus size={20} color={DT.colors.text} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add Card or Account</Text>
        </TouchableOpacity>

        {/* Transactions */}
        <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
        {transactions.map((tx) => (
          <TouchableOpacity key={tx.id} style={styles.txRow} onPress={() => router.push(`/profile/transaction/${tx.id}` as any)}>
            <View style={[styles.txDot, { backgroundColor: tx.positive ? DT.colors.secondary : DT.colors.primary }]} />
            <View style={styles.txInfo}>
              <Text style={styles.txLabel}>{tx.label}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.positive ? DT.colors.secondary : DT.colors.text }]}>{tx.amount}</Text>
            <ChevronRight size={14} color={DT.colors.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md, borderBottomWidth: 2, borderBottomColor: DT.colors.text },
  backBtn: { width: 40, height: 40, borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: DT.colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  walletCard: { backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text, padding: DT.spacing.lg, marginBottom: DT.spacing.lg, shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  walletLabel: { fontFamily: DT.typography.heading, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  walletBalance: { fontFamily: DT.typography.heading, fontSize: 36, color: DT.colors.surface, marginTop: 4 },
  walletSub: { fontFamily: DT.typography.body, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: DT.spacing.md },
  fundBtn: { alignSelf: 'flex-start', backgroundColor: DT.colors.accent, borderWidth: 2, borderColor: DT.colors.text, paddingHorizontal: DT.spacing.md, paddingVertical: 6, shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  fundBtnText: { fontFamily: DT.typography.heading, fontSize: 13, color: DT.colors.text },
  sectionLabel: { fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted, letterSpacing: 1.5, marginBottom: DT.spacing.md, marginTop: DT.spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, backgroundColor: DT.colors.surface, borderWidth: 2, borderColor: DT.colors.text, padding: DT.spacing.md, marginBottom: DT.spacing.md, shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  cardIcon: { width: 44, height: 44, borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.background, alignItems: 'center', justifyContent: 'center' },
  cardIconActive: { backgroundColor: DT.colors.secondary },
  cardInfo: { flex: 1 },
  cardLabel: { fontFamily: DT.typography.heading, fontSize: 14, color: DT.colors.text },
  cardNumber: { fontFamily: DT.typography.body, fontSize: 12, color: DT.colors.muted, marginTop: 2 },
  activePill: { alignSelf: 'flex-start', backgroundColor: DT.colors.accent, borderWidth: 1, borderColor: DT.colors.text, paddingHorizontal: 6, paddingVertical: 1, marginTop: 4 },
  activePillText: { fontFamily: DT.typography.heading, fontSize: 9, color: DT.colors.text, letterSpacing: 1 },
  deleteBtn: { padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.sm, height: 48, borderWidth: 2, borderColor: DT.colors.text, borderStyle: 'dashed', backgroundColor: DT.colors.surface, justifyContent: 'center', marginBottom: DT.spacing.lg },
  addBtnText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, paddingVertical: DT.spacing.md, borderBottomWidth: 2, borderBottomColor: DT.colors.text },
  txDot: { width: 10, height: 10, borderWidth: 2, borderColor: DT.colors.text },
  txInfo: { flex: 1 },
  txLabel: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  txDate: { fontFamily: DT.typography.body, fontSize: 12, color: DT.colors.muted },
  txAmount: { fontFamily: DT.typography.heading, fontSize: 15 },
});
