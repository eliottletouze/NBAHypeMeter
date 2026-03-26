export interface Player {
  id: string;      // personId from NBA API
  name: string;    // firstName + lastName
  team: string;    // team tricode (e.g. "LAL")
  isStar: boolean;
}

// Used to flag star players for hype calculation weighting
export const STAR_PLAYER_NAMES = new Set([
  'LeBron James', 'Stephen Curry', 'Nikola Jokic', 'Giannis Antetokounmpo',
  'Kevin Durant', 'Luka Doncic', 'Joel Embiid', 'Jayson Tatum',
  'Victor Wembanyama', 'Shai Gilgeous-Alexander', 'Kyrie Irving',
  'Anthony Edwards', 'Anthony Davis', 'Devin Booker', 'Jimmy Butler',
  'Damian Lillard', 'Donovan Mitchell', 'Paolo Banchero', "De'Aaron Fox",
  'Jalen Brunson', 'Trae Young', 'Ja Morant', 'Tyrese Haliburton',
  'Zion Williamson', 'LaMelo Ball', 'Karl-Anthony Towns', 'Cade Cunningham',
  'Scottie Barnes', 'Franz Wagner', 'Alperen Sengun',
]);
