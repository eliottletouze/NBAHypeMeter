import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, STAR_PLAYER_NAMES } from '../data/players';
import { NBA_TEAM_ID_TO_TRICODE } from '../data/teams';

const CACHE_KEY = '@nba_hype_all_players_v7';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function getNBASeasonString(): string {
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`; // ex: "2025-26"
}

function makePlayer(name: string, team: string): Player {
  return {
    id: name.toLowerCase().replace(/[^a-z]/g, '_'),
    name,
    team,
    isStar: STAR_PLAYER_NAMES.has(name),
  };
}

// Comprehensive fallback — used if API is unavailable
const FALLBACK_PLAYERS: Player[] = [
  // ATL
  ...['Trae Young','Dejounte Murray','De\'Andre Hunter','Onyeka Okongwu','Clint Capela','Bogdan Bogdanovic','Jalen Johnson','Saddiq Bey','Larry Nance Jr.','Kobe Bufkin'].map(n => makePlayer(n, 'ATL')),
  // BOS
  ...['Jayson Tatum','Jaylen Brown','Jrue Holiday','Al Horford','Kristaps Porzingis','Payton Pritchard','Sam Hauser','Luke Kornet','Oshae Brissett','Xavier Tillman'].map(n => makePlayer(n, 'BOS')),
  // BKN
  ...['Cam Thomas','Ben Simmons','Nic Claxton','Dennis Schroder','Day\'Ron Sharpe','Trendon Watford','Royce O\'Neale','Lonnie Walker IV','Noah Clowney','Jalen Wilson'].map(n => makePlayer(n, 'BKN')),
  // CHA
  ...['LaMelo Ball','Brandon Miller','Miles Bridges','Mark Williams','Terry Rozier','Grant Williams','P.J. Washington','Tre Mann','Nick Richards','Moussa Diabaté'].map(n => makePlayer(n, 'CHA')),
  // CHI
  ...['Zach LaVine','DeMar DeRozan','Nikola Vucevic','Patrick Williams','Coby White','Ayo Dosunmu','Alex Caruso','Andre Drummond','Torrey Craig','Dalen Terry'].map(n => makePlayer(n, 'CHI')),
  // CLE
  ...['Donovan Mitchell','Darius Garland','Evan Mobley','Jarrett Allen','Max Strus','Caris LeVert','Georges Niang','Dean Wade','Emoni Bates','Isaac Okoro'].map(n => makePlayer(n, 'CLE')),
  // DAL
  ...['Luka Doncic','Kyrie Irving','Tim Hardaway Jr.','P.J. Washington','Dereck Lively II','Maxi Kleber','Josh Green','Dante Exum','Dwight Powell','Markieff Morris'].map(n => makePlayer(n, 'DAL')),
  // DEN
  ...['Nikola Jokic','Jamal Murray','Michael Porter Jr.','Aaron Gordon','Kentavious Caldwell-Pope','Reggie Jackson','Justin Holiday','Zeke Nnaji','DeAndre Jordan','Vlatko Cancar'].map(n => makePlayer(n, 'DEN')),
  // DET
  ...['Cade Cunningham','Jaden Ivey','Bojan Bogdanovic','Isaiah Stewart','Monty Williams','Ausar Thompson','James Wiseman','Alec Burks','Monte Morris','Killian Hayes'].map(n => makePlayer(n, 'DET')),
  // GSW
  ...['Stephen Curry','Draymond Green','Andrew Wiggins','Jonathan Kuminga','Moses Moody','Brandin Podziemski','Gary Payton II','Kevon Looney','Trayce Jackson-Davis'].map(n => makePlayer(n, 'GSW')),
  // HOU
  ...['Alperen Sengun','Jalen Green','Fred VanVleet','Jabari Smith Jr.','Dillon Brooks','Cam Whitmore','Tari Eason','Jeff Green','Aaron Holiday','Jae\'Sean Tate'].map(n => makePlayer(n, 'HOU')),
  // IND
  ...['Tyrese Haliburton','Bennedict Mathurin','Myles Turner','Pascal Siakam','Aaron Nesmith','Andrew Nembhard','Bruce Brown','Obi Toppin','T.J. McConnell','Oscar Tshiebwe'].map(n => makePlayer(n, 'IND')),
  // LAC
  ...['James Harden','Kawhi Leonard','Paul George','Ivica Zubac','Russell Westbrook','Norman Powell','Terance Mann','Marcus Morris Sr.','Mason Plumlee','Amir Coffey'].map(n => makePlayer(n, 'LAC')),
  // LAL
  ...['LeBron James','Anthony Davis','Austin Reaves','D\'Angelo Russell','Jarred Vanderbilt','Taurean Prince','Rui Hachimura','Spencer Dinwiddie','Gabe Vincent','Christian Wood'].map(n => makePlayer(n, 'LAL')),
  // MEM
  ...['Ja Morant','Desmond Bane','Jaren Jackson Jr.','Marcus Smart','Vince Williams Jr.','Luke Kennard','Steven Adams','Ziaire Williams','John Konchar','Santi Aldama'].map(n => makePlayer(n, 'MEM')),
  // MIA
  ...['Jimmy Butler','Bam Adebayo','Tyler Herro','Jaime Jaquez Jr.','Kyle Lowry','Duncan Robinson','Josh Richardson','Kevin Love','Nikola Jovic','Caleb Martin'].map(n => makePlayer(n, 'MIA')),
  // MIL
  ...['Giannis Antetokounmpo','Damian Lillard','Khris Middleton','Brook Lopez','Bobby Portis','Patrick Beverley','MarJon Beauchamp','Malik Beasley','AJ Green','Robin Lopez'].map(n => makePlayer(n, 'MIL')),
  // MIN
  ...['Anthony Edwards','Karl-Anthony Towns','Rudy Gobert','Mike Conley','Jaden McDaniels','Naz Reid','Kyle Anderson','Monte Morris','Josh Minott','Nathan Knight'].map(n => makePlayer(n, 'MIN')),
  // NOP
  ...['Zion Williamson','Brandon Ingram','CJ McCollum','Jonas Valanciunas','Herb Jones','Jose Alvarado','Trey Murphy III','Dyson Daniels','Jordan Hawkins','Larry Nance Jr.'].map(n => makePlayer(n, 'NOP')),
  // NYK
  ...['Jalen Brunson','Julius Randle','Josh Hart','OG Anunoby','Isaiah Hartenstein','Donte DiVincenzo','Quentin Grimes','Mitchell Robinson','Immanuel Quickley','Miles McBride'].map(n => makePlayer(n, 'NYK')),
  // OKC
  ...['Shai Gilgeous-Alexander','Josh Giddey','Luguentz Dort','Chet Holmgren','Jalen Williams','Isaiah Joe','Aleksej Pokusevski','Aaron Wiggins','Kenrich Williams','Davis Bertans'].map(n => makePlayer(n, 'OKC')),
  // ORL
  ...['Paolo Banchero','Franz Wagner','Wendell Carter Jr.','Markelle Fultz','Jalen Suggs','Joe Ingles','Moritz Wagner','Gary Harris','Cole Anthony','Jonathan Isaac'].map(n => makePlayer(n, 'ORL')),
  // PHI
  ...['Joel Embiid','Tyrese Maxey','Kelly Oubre Jr.','Tobias Harris','De\'Anthony Melton','Buddy Hield','Robert Covington','Mo Bamba','Paul Reed','Cameron Payne'].map(n => makePlayer(n, 'PHI')),
  // PHX
  ...['Kevin Durant','Devin Booker','Bradley Beal','Jusuf Nurkic','Eric Gordon','Grayson Allen','Royce O\'Neale','Yuta Watanabe','Drew Eubanks','Bol Bol'].map(n => makePlayer(n, 'PHX')),
  // POR
  ...['Damian Lillard','Anfernee Simons','Jerami Grant','Deandre Ayton','Shaedon Sharpe','Matisse Thybulle','Malcolm Brogdon','Jabari Walker','Duop Reath','Toumani Camara'].map(n => makePlayer(n, 'POR')),
  // SAC
  ...['Domantas Sabonis','Malik Monk','Harrison Barnes','Keegan Murray','Kessler Edwards','Colby Jones','Maxime Raynaud'].map(n => makePlayer(n, 'SAC')),
  // SAS
  ...['Victor Wembanyama','De\'Aaron Fox','Devin Vassell','Jeremy Sochan','Keldon Johnson','Tre Jones','Zach Collins','Malaki Branham','Blake Wesley','Julian Champagnie'].map(n => makePlayer(n, 'SAS')),
  // TOR
  ...['Scottie Barnes','Pascal Siakam','OG Anunoby','Fred VanVleet','Jakob Poeltl','Immanuel Quickley','Gary Trent Jr.','Precious Achiuwa','RJ Barrett','Chris Boucher'].map(n => makePlayer(n, 'TOR')),
  // UTA
  ...['Lauri Markkanen','Jordan Clarkson','John Collins','Collin Sexton','Walker Kessler','Ochai Agbaji','Simone Fontecchio','Talen Horton-Tucker','Keyonte George','Taylor Hendricks'].map(n => makePlayer(n, 'UTA')),
  // WAS
  ...['Bradley Beal','Kyle Kuzma','Kristaps Porzingis','Tyus Jones','Deni Avdija','Jordan Poole','Corey Kispert','Daniel Gafford','Monte Morris','Patrick Baldwin Jr.'].map(n => makePlayer(n, 'WAS')),
].reduce((acc: Player[], p) => {
  if (!acc.some(existing => existing.name === p.name)) acc.push(p);
  return acc;
}, []).sort((a, b) => a.name.localeCompare(b.name));

export function useNBAPlayers() {
  const [players, setPlayers] = useState<Player[]>(FALLBACK_PLAYERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try cache first
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL && data.length > 0) {
            setPlayers(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Source 1 : NBA Stats API (stats.nba.com — officiel, toujours à jour)
      let fetched = false;
      try {
        const season = getNBASeasonString();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=${season}&IsOnlyCurrentSeason=1`,
          {
            signal: controller.signal,
            headers: {
              'Referer': 'https://www.nba.com/',
              'Origin': 'https://www.nba.com',
            },
          }
        ).finally(() => clearTimeout(timeoutId));
        if (res.ok) {
          const json = await res.json();
          const headers: string[] = json?.resultSets?.[0]?.headers ?? [];
          const rows: any[][] = json?.resultSets?.[0]?.rowSet ?? [];
          const nameIdx = headers.indexOf('DISPLAY_FIRST_LAST');
          const teamIdx = headers.indexOf('TEAM_ABBREVIATION');
          const statusIdx = headers.indexOf('ROSTERSTATUS');
          const idIdx = headers.indexOf('PERSON_ID');
          const mapped: Player[] = rows
            .filter(r => r[statusIdx] === 1 && r[teamIdx])
            .map(r => {
              const name: string = r[nameIdx];
              const team: string = r[teamIdx];
              return { id: String(r[idIdx]), name, team, isStar: STAR_PLAYER_NAMES.has(name) };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
          if (mapped.length > 100) {
            setPlayers(mapped);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: mapped, timestamp: Date.now() }));
            fetched = true;
          }
        }
      } catch {}

      // Source 2 : ESPN athletes (CORS natif, bon fallback)
      if (!fetched) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes?active=true&limit=700',
            { signal: controller.signal }
          ).finally(() => clearTimeout(timeoutId));
          if (res.ok) {
            const json = await res.json();
            const raw: any[] = json?.items ?? [];
            const mapped: Player[] = raw
              .filter((p: any) => p.displayName && p.team?.abbreviation)
              .map((p: any) => ({
                id: String(p.id),
                name: p.displayName as string,
                team: (p.team.abbreviation as string).toUpperCase(),
                isStar: STAR_PLAYER_NAMES.has(p.displayName),
              }))
              .sort((a: Player, b: Player) => a.name.localeCompare(b.name));
            if (mapped.length > 50) {
              setPlayers(mapped);
              await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: mapped, timestamp: Date.now() }));
              fetched = true;
            }
          }
        } catch {}
      }

      setLoading(false);
    }

    load();
  }, []);

  return { players, loading };
}
