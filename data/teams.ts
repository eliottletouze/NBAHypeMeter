export interface Team {
  abbr: string;
  name: string;
  fullName: string;
  emoji: string;
  roster: string[];
}

export const NBA_TEAM_ID_TO_TRICODE: Record<string, string> = {
  '1610612737': 'ATL',
  '1610612738': 'BOS',
  '1610612751': 'BKN',
  '1610612766': 'CHA',
  '1610612741': 'CHI',
  '1610612739': 'CLE',
  '1610612742': 'DAL',
  '1610612743': 'DEN',
  '1610612765': 'DET',
  '1610612744': 'GSW',
  '1610612745': 'HOU',
  '1610612754': 'IND',
  '1610612746': 'LAC',
  '1610612747': 'LAL',
  '1610612763': 'MEM',
  '1610612748': 'MIA',
  '1610612749': 'MIL',
  '1610612750': 'MIN',
  '1610612740': 'NOP',
  '1610612752': 'NYK',
  '1610612760': 'OKC',
  '1610612753': 'ORL',
  '1610612755': 'PHI',
  '1610612756': 'PHX',
  '1610612757': 'POR',
  '1610612758': 'SAC',
  '1610612759': 'SAS',
  '1610612761': 'TOR',
  '1610612762': 'UTA',
  '1610612764': 'WAS',
};

export const TEAMS: Record<string, Team> = {
  ATL: {
    abbr: 'ATL',
    name: 'Hawks',
    fullName: 'Atlanta Hawks',
    emoji: '🦅',
    roster: ['Trae Young', 'Dejounte Murray', 'De\'Andre Hunter', 'Onyeka Okongwu', 'Clint Capela'],
  },
  BOS: {
    abbr: 'BOS',
    name: 'Celtics',
    fullName: 'Boston Celtics',
    emoji: '☘️',
    roster: ['Jayson Tatum', 'Jaylen Brown', 'Jrue Holiday', 'Kristaps Porzingis', 'Al Horford'],
  },
  BKN: {
    abbr: 'BKN',
    name: 'Nets',
    fullName: 'Brooklyn Nets',
    emoji: '🕸️',
    roster: ['Cam Thomas', 'Ben Simmons', 'Nic Claxton', 'Day\'Ron Sharpe', 'Dennis Schroder'],
  },
  CHA: {
    abbr: 'CHA',
    name: 'Hornets',
    fullName: 'Charlotte Hornets',
    emoji: '🐝',
    roster: ['LaMelo Ball', 'Brandon Miller', 'Miles Bridges', 'Mark Williams', 'Terry Rozier'],
  },
  CHI: {
    abbr: 'CHI',
    name: 'Bulls',
    fullName: 'Chicago Bulls',
    emoji: '🐂',
    roster: ['Zach LaVine', 'DeMar DeRozan', 'Nikola Vucevic', 'Patrick Williams', 'Coby White'],
  },
  CLE: {
    abbr: 'CLE',
    name: 'Cavaliers',
    fullName: 'Cleveland Cavaliers',
    emoji: '⚔️',
    roster: ['Donovan Mitchell', 'Darius Garland', 'Evan Mobley', 'Jarrett Allen', 'Max Strus'],
  },
  DAL: {
    abbr: 'DAL',
    name: 'Mavericks',
    fullName: 'Dallas Mavericks',
    emoji: '🐴',
    roster: ['Luka Doncic', 'Kyrie Irving', 'P.J. Washington', 'Dereck Lively II', 'Tim Hardaway Jr.'],
  },
  DEN: {
    abbr: 'DEN',
    name: 'Nuggets',
    fullName: 'Denver Nuggets',
    emoji: '⛏️',
    roster: ['Nikola Jokic', 'Jamal Murray', 'Michael Porter Jr.', 'Aaron Gordon', 'Kentavious Caldwell-Pope'],
  },
  DET: {
    abbr: 'DET',
    name: 'Pistons',
    fullName: 'Detroit Pistons',
    emoji: '🔧',
    roster: ['Cade Cunningham', 'Jaden Ivey', 'Bojan Bogdanovic', 'Isaiah Stewart', 'Monte Morris'],
  },
  GSW: {
    abbr: 'GSW',
    name: 'Warriors',
    fullName: 'Golden State Warriors',
    emoji: '🌉',
    roster: ['Stephen Curry', 'Klay Thompson', 'Draymond Green', 'Andrew Wiggins', 'Chris Paul'],
  },
  HOU: {
    abbr: 'HOU',
    name: 'Rockets',
    fullName: 'Houston Rockets',
    emoji: '🚀',
    roster: ['Alperen Sengun', 'Jalen Green', 'Fred VanVleet', 'Jabari Smith Jr.', 'Dillon Brooks'],
  },
  IND: {
    abbr: 'IND',
    name: 'Pacers',
    fullName: 'Indiana Pacers',
    emoji: '🏎️',
    roster: ['Tyrese Haliburton', 'Bennedict Mathurin', 'Myles Turner', 'Pascal Siakam', 'Aaron Nesmith'],
  },
  LAC: {
    abbr: 'LAC',
    name: 'Clippers',
    fullName: 'LA Clippers',
    emoji: '⛵',
    roster: ['James Harden', 'Kawhi Leonard', 'Paul George', 'Ivica Zubac', 'Russell Westbrook'],
  },
  LAL: {
    abbr: 'LAL',
    name: 'Lakers',
    fullName: 'Los Angeles Lakers',
    emoji: '👑',
    roster: ['LeBron James', 'Anthony Davis', 'Austin Reaves', 'D\'Angelo Russell', 'Jarred Vanderbilt'],
  },
  MEM: {
    abbr: 'MEM',
    name: 'Grizzlies',
    fullName: 'Memphis Grizzlies',
    emoji: '🐻',
    roster: ['Ja Morant', 'Desmond Bane', 'Jaren Jackson Jr.', 'Marcus Smart', 'Vince Williams Jr.'],
  },
  MIA: {
    abbr: 'MIA',
    name: 'Heat',
    fullName: 'Miami Heat',
    emoji: '🔥',
    roster: ['Jimmy Butler', 'Bam Adebayo', 'Tyler Herro', 'Jaime Jaquez Jr.', 'Kyle Lowry'],
  },
  MIL: {
    abbr: 'MIL',
    name: 'Bucks',
    fullName: 'Milwaukee Bucks',
    emoji: '🦌',
    roster: ['Giannis Antetokounmpo', 'Damian Lillard', 'Khris Middleton', 'Brook Lopez', 'Bobby Portis'],
  },
  MIN: {
    abbr: 'MIN',
    name: 'Timberwolves',
    fullName: 'Minnesota Timberwolves',
    emoji: '🐺',
    roster: ['Anthony Edwards', 'Karl-Anthony Towns', 'Rudy Gobert', 'Mike Conley', 'Jaden McDaniels'],
  },
  NOP: {
    abbr: 'NOP',
    name: 'Pelicans',
    fullName: 'New Orleans Pelicans',
    emoji: '🦩',
    roster: ['Zion Williamson', 'Brandon Ingram', 'CJ McCollum', 'Jonas Valanciunas', 'Herb Jones'],
  },
  NYK: {
    abbr: 'NYK',
    name: 'Knicks',
    fullName: 'New York Knicks',
    emoji: '🗽',
    roster: ['Jalen Brunson', 'Julius Randle', 'Josh Hart', 'OG Anunoby', 'Isaiah Hartenstein'],
  },
  OKC: {
    abbr: 'OKC',
    name: 'Thunder',
    fullName: 'Oklahoma City Thunder',
    emoji: '⚡',
    roster: ['Shai Gilgeous-Alexander', 'Josh Giddey', 'Luguentz Dort', 'Chet Holmgren', 'Jalen Williams'],
  },
  ORL: {
    abbr: 'ORL',
    name: 'Magic',
    fullName: 'Orlando Magic',
    emoji: '🪄',
    roster: ['Paolo Banchero', 'Franz Wagner', 'Wendell Carter Jr.', 'Markelle Fultz', 'Jalen Suggs'],
  },
  PHI: {
    abbr: 'PHI',
    name: '76ers',
    fullName: 'Philadelphia 76ers',
    emoji: '🔔',
    roster: ['Joel Embiid', 'Tyrese Maxey', 'Kelly Oubre Jr.', 'Tobias Harris', 'De\'Anthony Melton'],
  },
  PHX: {
    abbr: 'PHX',
    name: 'Suns',
    fullName: 'Phoenix Suns',
    emoji: '☀️',
    roster: ['Kevin Durant', 'Devin Booker', 'Bradley Beal', 'Jusuf Nurkic', 'Eric Gordon'],
  },
  POR: {
    abbr: 'POR',
    name: 'Trail Blazers',
    fullName: 'Portland Trail Blazers',
    emoji: '🌲',
    roster: ['Damian Lillard', 'Anfernee Simons', 'Jerami Grant', 'Deandre Ayton', 'Shaedon Sharpe'],
  },
  SAC: {
    abbr: 'SAC',
    name: 'Kings',
    fullName: 'Sacramento Kings',
    emoji: '👑',
    roster: ['De\'Aaron Fox', 'Domantas Sabonis', 'Kevin Huerter', 'Malik Monk', 'Harrison Barnes'],
  },
  SAS: {
    abbr: 'SAS',
    name: 'Spurs',
    fullName: 'San Antonio Spurs',
    emoji: '⭐',
    roster: ['Victor Wembanyama', 'Devin Vassell', 'Jeremy Sochan', 'Keldon Johnson', 'Tre Jones'],
  },
  TOR: {
    abbr: 'TOR',
    name: 'Raptors',
    fullName: 'Toronto Raptors',
    emoji: '🦕',
    roster: ['Scottie Barnes', 'Pascal Siakam', 'OG Anunoby', 'Fred VanVleet', 'Jakob Poeltl'],
  },
  UTA: {
    abbr: 'UTA',
    name: 'Jazz',
    fullName: 'Utah Jazz',
    emoji: '🎵',
    roster: ['Lauri Markkanen', 'Jordan Clarkson', 'John Collins', 'Collin Sexton', 'Walker Kessler'],
  },
  WAS: {
    abbr: 'WAS',
    name: 'Wizards',
    fullName: 'Washington Wizards',
    emoji: '🧙',
    roster: ['Bradley Beal', 'Kyle Kuzma', 'Kristaps Porzingis', 'Tyus Jones', 'Deni Avdija'],
  },
};

// ESPN abbreviations differ for a few teams
const NBA_TO_ESPN_ABBR: Record<string, string> = {
  GSW: 'gs', SAS: 'sa', NOP: 'no', NYK: 'ny',
};

export function getTeamLogo(tricode: string): string {
  const abbr = (NBA_TO_ESPN_ABBR[tricode] ?? tricode).toLowerCase();
  return `https://a.espn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr}.png`;
}

export function getTeam(abbr: string): Team {
  return (
    TEAMS[abbr] ?? {
      abbr,
      name: abbr,
      fullName: abbr,
      emoji: '🏀',
      roster: [],
    }
  );
}
