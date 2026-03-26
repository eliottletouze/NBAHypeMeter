import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Player } from '../data/players';

interface Props {
  allPlayers: Player[];
  loadingPlayers: boolean;
  favoritePlayers: Player[];
  onAdd: (player: Player) => void;
  onRemove: (playerId: string) => void;
}

export default function PlayerSearch({ allPlayers, loadingPlayers, favoritePlayers, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('');

  const suggestions = query.trim().length >= 2
    ? allPlayers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          !favoritePlayers.some((fp) => fp.id === p.id)
      ).slice(0, 8)
    : [];

  function handleSelect(player: Player) {
    onAdd(player);
    setQuery('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>MES JOUEURS FAVORIS</Text>

      {/* Tags */}
      {favoritePlayers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
          contentContainerStyle={styles.tagsContent}
        >
          {favoritePlayers.map((player) => (
            <View key={player.id} style={styles.tag}>
              <Text style={styles.tagText}>{player.name}</Text>
              <TouchableOpacity
                onPress={() => onRemove(player.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Search input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={loadingPlayers ? 'Chargement des joueurs...' : 'Ajouter un joueur...'}
          placeholderTextColor="#404060"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions — visibles tant qu'il y a du texte, sans dépendre du focus */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && styles.suggestionBorder,
              ]}
              onPress={() => handleSelect(player)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionName}>{player.name}</Text>
              <View style={styles.suggestionMeta}>
                {player.isStar && <Text style={styles.starBadge}>⭐</Text>}
                <Text style={styles.suggestionTeam}>{player.team}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    color: '#6060A0',
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagsScroll: {
    marginBottom: 12,
  },
  tagsContent: {
    gap: 8,
    paddingRight: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131325',
    borderRadius: 100,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2e2e50',
    gap: 8,
  },
  tagText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#D0D0D8',
  },
  tagRemove: {
    fontSize: 16,
    color: '#6060A0',
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131325',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  clearBtn: {
    fontSize: 18,
    color: '#6060A0',
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#F0F0F5',
    paddingVertical: 12,
  },
  suggestions: {
    backgroundColor: '#131325',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a30',
  },
  suggestionName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#D0D0D8',
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBadge: {
    fontSize: 11,
  },
  suggestionTeam: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: '#6060A0',
    letterSpacing: 1,
  },
});
