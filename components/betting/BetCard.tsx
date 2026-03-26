import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { GameData } from '../../hooks/useGames';
import { GameOdds, generateOdds } from '../../hooks/useOdds';
import { SlipItem, BetType, BetSelection } from '../../hooks/useBetting';
import { getTeamLogo } from '../../data/teams';

interface Props {
  game: GameData;
  odds: GameOdds | undefined;
  slip: SlipItem[];
  onToggle: (item: SlipItem) => void;
  locked?: boolean;
}

type Market = 'moneyline' | 'handicap' | 'over_under';

const MARKET_LABELS: Record<Market, string> = {
  moneyline: 'Vainqueur',
  handicap: 'Handicap',
  over_under: 'Totaux',
};

export default function BetCard({ game, odds, slip, onToggle, locked = false }: Props) {
  const [market, setMarket] = useState<Market>('moneyline');
  const o = odds ?? generateOdds(game);

  function makeItem(betType: BetType, selection: BetSelection, label: string, oddVal: number): SlipItem {
    return {
      id: `${game.gameId}_${betType}_${selection}`,
      gameId: game.gameId,
      gameLabel: `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode}`,
      betType,
      selection,
      selectionLabel: label,
      odds: oddVal,
      homeLine: o.handicap.homeLine,
      awayLine: o.handicap.awayLine,
      ouLine: o.overUnder.line,
    };
  }

  function isSelected(betType: BetType, selection: BetSelection): boolean {
    return slip.some(i => i.id === `${game.gameId}_${betType}_${selection}`);
  }

  const homeCode = game.homeTeam.teamTricode;
  const awayCode = game.awayTeam.teamTricode;
  const hasAnySelected = slip.some(i => i.gameId === game.gameId);

  return (
    <View style={[styles.card, hasAnySelected && styles.cardActive]}>
      {/* Teams */}
      <View style={styles.teamsRow}>
        <View style={styles.teamSide}>
          <Image source={{ uri: game.awayTeam.logo ?? getTeamLogo(awayCode) }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tricode}>{awayCode}</Text>
        </View>
        <View style={styles.centerCol}>
          <Text style={styles.vsText}>@</Text>
          {game.gameTime && <Text style={styles.gameTime}>{game.gameTime}</Text>}
          {game.gameStatus === 3 && <Text style={styles.finalBadge}>FINAL</Text>}
        </View>
        <View style={styles.teamSide}>
          <Image source={{ uri: game.homeTeam.logo ?? getTeamLogo(homeCode) }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tricode}>{homeCode}</Text>
        </View>
      </View>

      {locked ? (
        <View style={styles.lockedRow}>
          <Text style={styles.lockedText}>🔒 Paris indisponibles pour les matchs passés</Text>
        </View>
      ) : (
        <>
          {/* Market tabs */}
          <View style={styles.marketTabs}>
            {(['moneyline', 'handicap', 'over_under'] as Market[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.marketTab, market === m && styles.marketTabActive]}
                onPress={() => setMarket(m)}
              >
                <Text style={[styles.marketTabText, market === m && styles.marketTabTextActive]}>
                  {MARKET_LABELS[m]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Odds buttons */}
          <View style={styles.oddsRow}>
            {market === 'moneyline' && (
              <>
                <OddsBtn
                  label={awayCode}
                  odds={o.moneyline.away}
                  selected={isSelected('moneyline', 'away')}
                  onPress={() => onToggle(makeItem('moneyline', 'away', awayCode, o.moneyline.away))}
                />
                <OddsBtn
                  label={homeCode}
                  odds={o.moneyline.home}
                  selected={isSelected('moneyline', 'home')}
                  onPress={() => onToggle(makeItem('moneyline', 'home', homeCode, o.moneyline.home))}
                />
              </>
            )}
            {market === 'handicap' && (
              <>
                <OddsBtn
                  label={`${awayCode} ${o.handicap.awayLine > 0 ? '+' : ''}${o.handicap.awayLine}`}
                  odds={o.handicap.awayOdds}
                  selected={isSelected('handicap', 'away')}
                  onPress={() => onToggle(makeItem('handicap', 'away', `${awayCode} ${o.handicap.awayLine > 0 ? '+' : ''}${o.handicap.awayLine}`, o.handicap.awayOdds))}
                />
                <OddsBtn
                  label={`${homeCode} ${o.handicap.homeLine > 0 ? '+' : ''}${o.handicap.homeLine}`}
                  odds={o.handicap.homeOdds}
                  selected={isSelected('handicap', 'home')}
                  onPress={() => onToggle(makeItem('handicap', 'home', `${homeCode} ${o.handicap.homeLine > 0 ? '+' : ''}${o.handicap.homeLine}`, o.handicap.homeOdds))}
                />
              </>
            )}
            {market === 'over_under' && (
              <>
                <OddsBtn
                  label={`Over ${o.overUnder.line}`}
                  odds={o.overUnder.overOdds}
                  selected={isSelected('over_under', 'over')}
                  onPress={() => onToggle(makeItem('over_under', 'over', `Over ${o.overUnder.line}`, o.overUnder.overOdds))}
                />
                <OddsBtn
                  label={`Under ${o.overUnder.line}`}
                  odds={o.overUnder.underOdds}
                  selected={isSelected('over_under', 'under')}
                  onPress={() => onToggle(makeItem('over_under', 'under', `Under ${o.overUnder.line}`, o.overUnder.underOdds))}
                />
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function OddsBtn({ label, odds, selected, onPress }: {
  label: string; odds: number; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.oddsBtn, selected && styles.oddsBtnSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.oddsBtnLabel, selected && styles.oddsBtnLabelSelected]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.oddsBtnOdds, selected && styles.oddsBtnOddsSelected]}>
        {odds.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d0d1b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 14,
    marginBottom: 10,
  },
  cardActive: { borderColor: '#9B7FFF' },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamSide: { alignItems: 'center', flex: 1 },
  logo: { width: 38, height: 38, marginBottom: 4 },
  tricode: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#F0F0F5', letterSpacing: 1 },
  centerCol: { alignItems: 'center', flex: 0.8 },
  vsText: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#404060', letterSpacing: 1 },
  gameTime: { fontFamily: 'BebasNeue_400Regular', fontSize: 15, color: '#9B7FFF', marginTop: 2 },
  finalBadge: { fontFamily: 'BebasNeue_400Regular', fontSize: 10, color: '#6060A0', letterSpacing: 1, marginTop: 2 },
  marketTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  marketTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e35',
    alignItems: 'center',
  },
  marketTabActive: { borderColor: '#9B7FFF', backgroundColor: '#13132a' },
  marketTabText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060' },
  marketTabTextActive: { color: '#9B7FFF', fontWeight: '600' },
  lockedRow: { paddingVertical: 12, alignItems: 'center' },
  lockedText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#404060' },
  oddsRow: { flexDirection: 'row', gap: 8 },
  oddsBtn: {
    flex: 1,
    backgroundColor: '#131325',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  oddsBtnSelected: { backgroundColor: '#1e1040', borderColor: '#9B7FFF' },
  oddsBtnLabel: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0' },
  oddsBtnLabelSelected: { color: '#C0B0FF' },
  oddsBtnOdds: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#C0C0D8', lineHeight: 24 },
  oddsBtnOddsSelected: { color: '#9B7FFF' },
});
