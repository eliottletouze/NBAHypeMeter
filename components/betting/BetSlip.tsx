import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SlipItem, MIN_STAKE } from '../../hooks/useBetting';

interface Props {
  slip: SlipItem[];
  combinedOdds: number;
  balance: number;
  maxStake: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlace: (stake: number) => { ok: boolean; error?: string };
}

export default function BetSlip({ slip, combinedOdds, balance, maxStake, onRemove, onClear, onPlace }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [stakeInput, setStakeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (slip.length === 0) return null;

  const stake = parseInt(stakeInput, 10) || 0;
  const potentialWin = stake > 0 ? Math.round(stake * combinedOdds) : 0;

  function handlePlace() {
    const result = onPlace(stake);
    if (!result.ok) {
      setError(result.error ?? 'Erreur');
      return;
    }
    setSuccess(true);
    setStakeInput('');
    setError('');
    setExpanded(false);
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <>
      {/* Barre sticky */}
      <TouchableOpacity style={styles.bar} onPress={() => setExpanded(true)} activeOpacity={0.85}>
        <View style={styles.barLeft}>
          <Text style={styles.barCount}>{slip.length}</Text>
          <Text style={styles.barLabel}>{slip.length === 1 ? 'PARI' : 'COMBINÉ'}</Text>
        </View>
        <View style={styles.barCenter}>
          <Text style={styles.barOdds}>{combinedOdds.toFixed(2)}x</Text>
        </View>
        <View style={styles.barRight}>
          <Text style={styles.barAction}>PLACER ›</Text>
        </View>
      </TouchableOpacity>

      {/* Modal détail */}
      <Modal visible={expanded} transparent animationType="slide" onRequestClose={() => setExpanded(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setExpanded(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {slip.length === 1 ? 'MON PARI' : `COMBINÉ ${slip.length} SÉLECTIONS`}
              </Text>
              <TouchableOpacity onPress={onClear}>
                <Text style={styles.clearText}>Tout effacer</Text>
              </TouchableOpacity>
            </View>

            {/* Sélections */}
            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
              {slip.map(item => (
                <View key={item.id} style={styles.slipItem}>
                  <View style={styles.slipItemInfo}>
                    <Text style={styles.slipItemGame} numberOfLines={1}>{item.gameLabel}</Text>
                    <Text style={styles.slipItemSel}>{item.selectionLabel}</Text>
                  </View>
                  <Text style={styles.slipItemOdds}>{item.odds.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Mise */}
            <View style={styles.stakeSection}>
              <View style={styles.stakeRow}>
                <Text style={styles.stakeLabel}>Mise (💰)</Text>
                <Text style={styles.stakeInfo}>
                  Min {MIN_STAKE} — Max {maxStake.toLocaleString('fr-FR')}
                </Text>
              </View>
              <View style={styles.stakeInputRow}>
                <TextInput
                  style={styles.stakeInput}
                  value={stakeInput}
                  onChangeText={t => { setStakeInput(t.replace(/[^0-9]/g, '')); setError(''); }}
                  keyboardType="number-pad"
                  placeholder={`${MIN_STAKE}`}
                  placeholderTextColor="#404060"
                  maxLength={7}
                />
                {/* Raccourcis */}
                {[500, 1000, 2000].map(v => (
                  <TouchableOpacity key={v} style={styles.shortcut} onPress={() => setStakeInput(String(Math.min(v, maxStake)))}>
                    <Text style={styles.shortcutText}>{v >= 1000 ? `${v / 1000}k` : v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>COTE COMBINÉE</Text>
                  <Text style={styles.summaryValue}>{combinedOdds.toFixed(2)}x</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryLabel}>GAIN POTENTIEL</Text>
                  <Text style={[styles.summaryValue, styles.summaryGain]}>
                    {potentialWin > 0 ? `${potentialWin.toLocaleString('fr-FR')} 💰` : '—'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.placeBtn, stake < MIN_STAKE && styles.placeBtnDisabled]}
                onPress={handlePlace}
                disabled={stake < MIN_STAKE}
              >
                <Text style={styles.placeBtnText}>
                  {success ? '✅ PARI ENREGISTRÉ !' : 'CONFIRMER LE PARI'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.balanceText}>
                Solde : {balance.toLocaleString('fr-FR')} 💰
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#9B7FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  barCount: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#fff', lineHeight: 24 },
  barLabel: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#D0C0FF', letterSpacing: 1.5 },
  barCenter: { flex: 1, alignItems: 'center' },
  barOdds: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: '#fff' },
  barRight: { flex: 1, alignItems: 'flex-end' },
  barAction: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#D0C0FF', letterSpacing: 1 },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#0d0d1b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handle: { width: 36, height: 4, backgroundColor: '#2e2e50', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#F0F0F5', letterSpacing: 1.5 },
  clearText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#E84040' },
  itemList: { maxHeight: 180, marginBottom: 12 },
  slipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131325',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1e1e35',
  },
  slipItemInfo: { flex: 1 },
  slipItemGame: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#6060A0' },
  slipItemSel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#D0D0E8', fontWeight: '600' },
  slipItemOdds: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#9B7FFF', marginHorizontal: 12 },
  removeBtn: { padding: 4 },
  removeText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#404060' },
  stakeSection: { gap: 10 },
  stakeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stakeLabel: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#6060A0', letterSpacing: 1 },
  stakeInfo: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060' },
  stakeInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stakeInput: {
    flex: 1,
    backgroundColor: '#131325',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e50',
    color: '#F0F0F5',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shortcut: {
    backgroundColor: '#131325',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shortcutText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#6060A0' },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#E84040', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#131325', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1e1e35' },
  summaryLabel: { fontFamily: 'BebasNeue_400Regular', fontSize: 10, color: '#404060', letterSpacing: 1.5 },
  summaryValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#C0C0D8', lineHeight: 24 },
  summaryGain: { color: '#9B7FFF' },
  placeBtn: { backgroundColor: '#9B7FFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  placeBtnDisabled: { backgroundColor: '#2e2e50', opacity: 0.5 },
  placeBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 17, color: '#fff', letterSpacing: 1.5 },
  balanceText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#404060', textAlign: 'center' },
});
