import { db } from "@workspace/db";
import { cardsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const seedCards = [
  // Baseball
  { player: "Mickey Mantle", year: 1952, brand: "Topps", cardSet: "Topps Baseball", cardNumber: "#311", sport: "Baseball", rookieCard: false, estimatedValue: 125000, description: "The holy grail of baseball cards. Mickey Mantle's 1952 Topps card is one of the most iconic sports collectibles ever made." },
  { player: "Ken Griffey Jr.", year: 1989, brand: "Upper Deck", cardSet: "Upper Deck Baseball", cardNumber: "#1", sport: "Baseball", rookieCard: true, estimatedValue: 850, description: "The iconic Ken Griffey Jr. rookie card from Upper Deck's debut set. One of the most recognizable rookie cards of the junk wax era." },
  { player: "Shohei Ohtani", year: 2018, brand: "Topps", cardSet: "Topps Update", cardNumber: "#US1", sport: "Baseball", rookieCard: true, estimatedValue: 180, description: "Shohei Ohtani's Topps Update rookie card, showcasing the two-way phenom who revolutionized baseball." },
  { player: "Mike Trout", year: 2011, brand: "Topps", cardSet: "Topps Update", cardNumber: "#US175", sport: "Baseball", rookieCard: true, estimatedValue: 380, description: "Mike Trout's most sought-after rookie card. The consensus best player of his generation." },
  { player: "Ronald Acuña Jr.", year: 2018, brand: "Topps", cardSet: "Topps Chrome", cardNumber: "#31", sport: "Baseball", rookieCard: true, estimatedValue: 120, description: "Ronald Acuña Jr.'s Topps Chrome rookie card. The Braves' phenom and perennial MVP candidate." },
  { player: "Juan Soto", year: 2018, brand: "Bowman", cardSet: "Bowman Chrome", cardNumber: "#BCP88", sport: "Baseball", rookieCard: true, estimatedValue: 95, description: "Juan Soto's Bowman Chrome prospect card. Exceptional plate discipline and power from the young slugger." },
  { player: "Babe Ruth", year: 1933, brand: "Goudey", cardSet: "Goudey Baseball", cardNumber: "#144", sport: "Baseball", rookieCard: false, estimatedValue: 22000, description: "Babe Ruth's classic 1933 Goudey card. A cornerstone of any serious vintage baseball collection." },
  { player: "Fernando Tatis Jr.", year: 2019, brand: "Topps", cardSet: "Topps Chrome", cardNumber: "#203", sport: "Baseball", rookieCard: true, estimatedValue: 85, description: "Fernando Tatis Jr. rookie card showcasing the Padres' electric shortstop." },

  // Basketball
  { player: "LeBron James", year: 2003, brand: "Topps", cardSet: "Topps Basketball", cardNumber: "#221", sport: "Basketball", rookieCard: true, estimatedValue: 2800, description: "LeBron James' Topps rookie card. One of the most valuable modern basketball rookies from the King's debut season." },
  { player: "Michael Jordan", year: 1986, brand: "Fleer", cardSet: "Fleer Basketball", cardNumber: "#57", sport: "Basketball", rookieCard: true, estimatedValue: 12000, description: "The definitive Michael Jordan rookie card. The 1986 Fleer #57 is the most iconic basketball card of all time." },
  { player: "Stephen Curry", year: 2009, brand: "Topps", cardSet: "Topps Basketball", cardNumber: "#321", sport: "Basketball", rookieCard: true, estimatedValue: 750, description: "Steph Curry's coveted rookie card from his first NBA season. The greatest shooter in basketball history." },
  { player: "Luka Dončić", year: 2018, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#280", sport: "Basketball", rookieCard: true, estimatedValue: 420, description: "Luka Dončić's Panini Prizm rookie card. The Slovenian prodigy who became an instant NBA sensation." },
  { player: "Victor Wembanyama", year: 2023, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#1", sport: "Basketball", rookieCard: true, estimatedValue: 890, description: "Victor Wembanyama's debut Prizm rookie card. The generational talent who was hyped as an alien before the draft." },
  { player: "Giannis Antetokounmpo", year: 2013, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#290", sport: "Basketball", rookieCard: true, estimatedValue: 580, description: "The Greek Freak's Panini Prizm rookie card. Giannis went from unknown to two-time MVP and champion." },
  { player: "Kobe Bryant", year: 1996, brand: "Topps", cardSet: "Topps Chrome", cardNumber: "#138", sport: "Basketball", rookieCard: true, estimatedValue: 1800, description: "Kobe Bryant's Chrome rookie card. A must-have for any basketball collector in memory of the Black Mamba." },
  { player: "Caitlin Clark", year: 2024, brand: "Panini", cardSet: "Panini Prizm WNBA", cardNumber: "#1", sport: "Basketball", rookieCard: true, estimatedValue: 320, description: "Caitlin Clark's WNBA Prizm rookie card. The record-breaking college star who transformed women's basketball." },

  // Football
  { player: "Patrick Mahomes", year: 2017, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#269", sport: "Football", rookieCard: true, estimatedValue: 1200, description: "Patrick Mahomes' Panini Prizm rookie card. The Kansas City Chiefs' quarterback and multiple Super Bowl champion." },
  { player: "Tom Brady", year: 2000, brand: "Bowman", cardSet: "Bowman Football", cardNumber: "#236", sport: "Football", rookieCard: true, estimatedValue: 3500, description: "Tom Brady's rookie card from his draft year. The GOAT's earliest cards are among football's most prized collectibles." },
  { player: "Joe Burrow", year: 2020, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#307", sport: "Football", rookieCard: true, estimatedValue: 280, description: "Joe Burrow's Panini Prizm rookie. The Bengals' franchise quarterback who led them to the Super Bowl." },
  { player: "Josh Allen", year: 2018, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#212", sport: "Football", rookieCard: true, estimatedValue: 340, description: "Josh Allen's rookie Prizm card. The Bills' dual-threat QB beloved for his cannon arm and MVP-caliber seasons." },
  { player: "Justin Jefferson", year: 2020, brand: "Panini", cardSet: "Panini Mosaic", cardNumber: "#204", sport: "Football", rookieCard: true, estimatedValue: 95, description: "Justin Jefferson's Mosaic rookie card. The Vikings' receiver broke rookie records and became the best in the game." },
  { player: "C.J. Stroud", year: 2023, brand: "Panini", cardSet: "Panini Prizm", cardNumber: "#371", sport: "Football", rookieCard: true, estimatedValue: 145, description: "C.J. Stroud's Prizm rookie from his record-setting first NFL season with the Houston Texans." },

  // Hockey
  { player: "Wayne Gretzky", year: 1979, brand: "O-Pee-Chee", cardSet: "O-Pee-Chee Hockey", cardNumber: "#18", sport: "Hockey", rookieCard: true, estimatedValue: 18000, description: "Wayne Gretzky's official rookie card. The Great One's OPC rookie is the most coveted hockey card in existence." },
  { player: "Connor McDavid", year: 2015, brand: "Upper Deck", cardSet: "Upper Deck Young Guns", cardNumber: "#201", sport: "Hockey", rookieCard: true, estimatedValue: 850, description: "Connor McDavid's Young Guns rookie card. The fastest player in the modern game and a perennial Hart Trophy contender." },

  // Soccer
  { player: "Lionel Messi", year: 2004, brand: "Panini", cardSet: "Panini Mega Cracks", cardNumber: "#MC6", sport: "Soccer", rookieCard: true, estimatedValue: 4200, description: "Lionel Messi's first mainstream trading card. The GOAT's earliest cards are among soccer's most sought-after collectibles." },
  { player: "Kylian Mbappé", year: 2017, brand: "Panini", cardSet: "Panini Prizm World Cup", cardNumber: "#76", sport: "Soccer", rookieCard: true, estimatedValue: 380, description: "Kylian Mbappé's Panini Prizm World Cup card from his breakthrough tournament where France won the title." },
];

async function seed() {
  console.log("Seeding cards database...");

  for (const card of seedCards) {
    const id = randomUUID();
    const name = `${card.year} ${card.brand} ${card.player}${card.rookieCard ? " RC" : ""}`;
    await db
      .insert(cardsTable)
      .values({
        id,
        name,
        player: card.player,
        sport: card.sport,
        year: card.year,
        brand: card.brand,
        cardSet: card.cardSet,
        cardNumber: card.cardNumber,
        imageUrl: null,
        estimatedValue: String(card.estimatedValue),
        condition: "Near Mint",
        rookieCard: card.rookieCard,
        serialNumbered: false,
        description: card.description,
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${seedCards.length} cards`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
