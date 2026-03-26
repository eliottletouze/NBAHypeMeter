import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { TTFLLeague as LeagueType, TTFLLeagueMember } from '../../hooks/useTTFL';

interface Props {
  leagues: LeagueType[];
  pseudo: string;
  seasonTotal: number;
  onCreateLeague: (name: string) => LeagueType;
  onDeleteLeague: (code: string) => void;
  onSavePseudo: (p: string) => void;
}

export default function TTFLLeague({ leagues, pseudo, seasonTotal, onCreateLeague, onDeleteLeague, onSavePseudo }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [editPseudo, setEditPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState(pseudo);
  const [createdLeague, setCreatedLeague] = useState<LeagueType | null>(null);

  function handleCreate() {
    if (!leagueName.trim()) return;
    const league = onCreateLeague(leagueName.trim());
    setCreatedLeague(league);
    setLeagueName('');
    setShowCreate(false);
  }

  function handleSavePseudo() {
    if (pseudoInput.trim()) {
      onSavePseudo(pseudoInput.trim());
      setEditPseudo(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Pseudo */}
      <View style={styles.pseudoRow}>
        {editPseudo ? (
          <View style={styles.pseudoEdit}>
            <TextInput
              style={styles.pseudoInput}
              value={pseudoInput}
              onChangeText={setPseudoInput}
              placeholder="Ton pseudo..."
              placeholderTextColor="#404060"
              maxLength={20}
              autoFocus
            />
            <TouchableOpacity style={styles.pseudoSaveBtn} onPress={handleSavePseudo}>
              <Text style={styles.pseudoSaveBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pseudoDisplay} onPress={() => { setPseudoInput(pseudo); setEditPseudo(true); }}>
            <Text style={styles.pseudoValue}>{pseudo || 'Définir un pseudo'}</Text>
            <Text style={styles.pseudoEdit2}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mes ligues */}
      {leagues.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>Crée ta ligue privée</Text>
          <Text style={styles.emptyText}>
            Génère un code à partager avec tes amis et compare vos scores TTFL chaque soir.
          </Text>
        </View>
      ) : (
        leagues.map(league => (
          <LeagueCard
            key={league.code}
            league={league}
            seasonTotal={seasonTotal}
            pseudo={pseudo}
            onDelete={() => {
              Alert.alert('Supprimer la ligue', `Supprimer "${league.name}" ?`, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => onDeleteLeague(league.code) },
              ]);
            }}
          />
        ))
      )}

      {/* Bouton créer */}
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
        <Text style={styles.createBtnText}>+ CRÉER UNE LIGUE</Text>
      </TouchableOpacity>

      <Text style={styles.syncNote}>
        🔗 Synchronisation entre appareils — disponible prochainement
      </Text>

      {/* Modale création */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>NOUVELLE LIGUE</Text>
            <TextInput
              style={styles.modalInput}
              value={leagueName}
              onChangeText={setLeagueName}
              placeholder="Nom de la ligue..."
              placeholderTextColor="#404060"
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !leagueName.trim() && { opacity: 0.4 }]}
                onPress={handleCreate}
                disabled={!leagueName.trim()}
              >
                <Text style={styles.modalConfirmText}>CRÉER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale code généré */}
      {createdLeague && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setCreatedLeague(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>LIGUE CRÉÉE !</Text>
              <Text style={styles.codeLabel}>Code à partager</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeValue}>{createdLeague.code}</Text>
              </View>
              <Text style={styles.codeHint}>
                Tes amis pourront rejoindre la ligue en entrant ce code — synchronisation en ligne disponible prochainement.
              </Text>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setCreatedLeague(null)}>
                <Text style={styles.modalConfirmText}>FERMER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function LeagueCard({ league, seasonTotal, pseudo, onDelete }: {
  league: LeagueType; seasonTotal: number; pseudo: string; onDelete: () => void;
}) {
  // Ajouter le joueur courant à la vue avec ses stats réelles
  const allMembers: { id: string; pseudo: string; isMe: boolean; score: number }[] = [
    { id: 'me', pseudo: pseudo || 'Moi', isMe: true, score: seasonTotal },
    ...league.members.filter(m => !m.isMe).map(m => ({
      id: m.id,
      pseudo: m.pseudo,
      isMe: false,
      score: Object.values(m.picks).reduce((acc, p) => acc + (p.score ?? 0), 0),
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.leagueCard}>
      <View style={styles.leagueHeader}>
        <View>
          <Text style={styles.leagueName}>{league.name}</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.leagueCode}>Code : {league.code}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Classement */}
      {allMembers.map((m, idx) => (
        <View key={m.id} style={[styles.memberRow, m.isMe && styles.memberRowMe]}>
          <Text style={styles.memberRank}>#{idx + 1}</Text>
          <Text style={[styles.memberPseudo, m.isMe && styles.memberPseudoMe]} numberOfLines={1}>
            {m.isMe ? '👤 ' : ''}{m.pseudo}
          </Text>
          <Text style={[styles.memberScore, m.isMe && styles.memberScoreMe]}>
            {m.score.toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  pseudoRow: { marginBottom: 4 },
  pseudoEdit: { flexDirection: 'row', gap: 8 },
  pseudoInput: {
    flex: 1,
    backgroundColor: '#131325',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9B7FFF',
    color: '#F0F0F5',
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pseudoSaveBtn: { backgroundColor: '#9B7FFF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  pseudoSaveBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 15, color: '#fff' },
  pseudoDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pseudoValue: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#C0C0D8', fontWeight: '600' },
  pseudoEdit2: { fontSize: 13 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#D0D0E8', letterSpacing: 1 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#6060A0', textAlign: 'center', lineHeight: 18 },
  createBtn: {
    borderWidth: 1,
    borderColor: '#9B7FFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#9B7FFF', letterSpacing: 1.5 },
  syncNote: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060', textAlign: 'center' },
  leagueCard: {
    backgroundColor: '#0d0d1b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 14,
    gap: 8,
  },
  leagueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  leagueName: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#F0F0F5', letterSpacing: 1 },
  leagueCode: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9B7FFF', marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#404060' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#131325' },
  memberRowMe: { backgroundColor: '#0f0f25', marginHorizontal: -14, paddingHorizontal: 14, borderTopColor: 'transparent' },
  memberRank: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#404060', width: 28 },
  memberPseudo: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#8080A0' },
  memberPseudoMe: { color: '#D0D0E8', fontWeight: '600' },
  memberScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#6060A0', lineHeight: 20 },
  memberScoreMe: { color: '#9B7FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#0d0d1b', borderRadius: 20, borderWidth: 1, borderColor: '#1e1e35', padding: 24, width: '100%', gap: 16 },
  modalTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#F0F0F5', letterSpacing: 2, textAlign: 'center' },
  modalInput: {
    backgroundColor: '#131325',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e50',
    color: '#F0F0F5',
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderColor: '#2e2e50', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6060A0' },
  modalConfirmBtn: { flex: 1.5, backgroundColor: '#9B7FFF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { fontFamily: 'BebasNeue_400Regular', fontSize: 15, color: '#fff', letterSpacing: 1 },
  codeLabel: { fontFamily: 'BebasNeue_400Regular', fontSize: 12, color: '#6060A0', letterSpacing: 2, textAlign: 'center' },
  codeBox: { backgroundColor: '#131325', borderRadius: 12, borderWidth: 1, borderColor: '#9B7FFF', paddingVertical: 16, alignItems: 'center' },
  codeValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 42, color: '#9B7FFF', letterSpacing: 8 },
  codeHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#6060A0', textAlign: 'center', lineHeight: 18 },
});
