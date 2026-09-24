/**
 * Seed de datos de prueba para desarrollo local.
 *
 * Requiere que antes se hayan cargado los datos reales desde OpenF1 con el DevController
 * (create-season → sync-calendar → sync-drivers → update-race-status → sync-all-race-results).
 * Crea usuarios, ligas, miembros y predicciones. NO calcula puntajes: después de correrlo,
 * llamar a GET /dev/calculate-score para que lo haga el código real.
 *
 * Es idempotente: se puede correr varias veces con el mismo resultado.
 * Uso: npx prisma db seed
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient, RaceStatus } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const SEASON_YEAR = 2026;
const PASSWORD = 'prode123';
const TRACKED_DRIVER_NUMBER = 43; // Franco Colapinto

const USERS = [
  { id: '00000000-0000-4000-8000-000000000001', email: 'tomas@prode.dev', name: 'Tomás' },
  { id: '00000000-0000-4000-8000-000000000002', email: 'juan@prode.dev', name: 'Juan' },
  { id: '00000000-0000-4000-8000-000000000003', email: 'lucia@prode.dev', name: 'Lucía' },
  { id: '00000000-0000-4000-8000-000000000004', email: 'martin@prode.dev', name: 'Martín' },
] as const;
const [TOMAS, JUAN, LUCIA, MARTIN] = USERS;

const LEAGUE_AMIGOS = '00000000-0000-4000-8000-0000000000a1';
const LEAGUE_PUBLICA = '00000000-0000-4000-8000-0000000000a2';

// Carrera (por orden de ronda, base 0) en la que Martín abandona la Liga Pública.
const MARTIN_LEAVES_AFTER_RACE_INDEX = 9;

function createPrismaClient(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL as string);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

// PRNG determinista (mulberry32) para que el seed genere siempre las mismas predicciones.
function createRandom(seedText: string): () => number {
  let seed = 0;
  for (const char of seedText) {
    seed = (Math.imul(31, seed) + char.charCodeAt(0)) | 0;
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

type RaceWithResults = {
  id: string;
  poleDriverId: string;
  safetyCar: boolean;
  dnfCount: number;
  finishingOrder: string[]; // driverIds ordenados por posición real
  trackedDriverPosition: number | null;
};

type GeneratedPrediction = {
  predictedOrder: string[]; // largo = máximo de slots entre ligas; se recorta por liga
  predictedPoleDriverId: string;
  safetyCar: boolean;
  dnfCount: number;
  trackedDriverPosition: number;
};

/**
 * Genera una predicción "creíble": parte del resultado real y le mete ruido,
 * para que haya aciertos exactos, a una posición y fallos.
 */
function generatePrediction(
  random: () => number,
  race: RaceWithResults,
  slots: number,
): GeneratedPrediction {
  const order = race.finishingOrder.slice(0, slots + 3);
  const swaps = 2 + Math.floor(random() * 5);
  for (let i = 0; i < swaps; i++) {
    const index = Math.floor(random() * (order.length - 1));
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
  }

  const realTracked = race.trackedDriverPosition ?? 10 + Math.floor(random() * 8);
  const trackedNoise = pick(random, [-2, -1, 0, 0, 1, 2]);

  return {
    predictedOrder: order.slice(0, slots),
    predictedPoleDriverId:
      random() < 0.5 ? race.poleDriverId : pick(random, race.finishingOrder.slice(0, 6)),
    safetyCar: random() < 0.65 ? race.safetyCar : !race.safetyCar,
    dnfCount: Math.max(0, race.dnfCount + pick(random, [-1, 0, 0, 1, 2])),
    trackedDriverPosition: Math.min(22, Math.max(1, realTracked + trackedNoise)),
  };
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de desarrollo no se puede correr en producción');
  }

  const prisma = createPrismaClient();

  try {
    const season = await prisma.season.findUnique({ where: { year: SEASON_YEAR } });
    const drivers = season
      ? await prisma.driver.findMany({ where: { seasonId: season.id } })
      : [];
    const syncedRaces = season
      ? await prisma.race.findMany({
          where: { seasonId: season.id, status: RaceStatus.RESULTS_SYNCED },
          include: { raceResult: true, driverResults: true },
          orderBy: { round: 'asc' },
        })
      : [];

    if (!season || drivers.length === 0 || syncedRaces.length === 0) {
      throw new Error(
        'Faltan datos de OpenF1. Con el back corriendo, llamá en orden a /dev/create-season, ' +
          '/dev/sync-calendar, /dev/sync-drivers, /dev/update-race-status y /dev/sync-all-race-results.',
      );
    }

    const trackedDriver = drivers.find((d) => d.driverNumber === TRACKED_DRIVER_NUMBER) ?? null;

    // 1. Usuarios
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    for (const user of USERS) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name },
        create: { ...user, password: passwordHash },
      });
    }

    // 2. Ligas
    const leagues = [
      {
        id: LEAGUE_AMIGOS,
        name: 'Liga Amigos',
        ownerId: TOMAS.id,
        inviteCode: 'AMIGOS',
        isPublic: false,
        predictionSlots: 5,
        trackedDriverId: trackedDriver?.id ?? null,
      },
      {
        id: LEAGUE_PUBLICA,
        name: 'Liga Pública',
        ownerId: JUAN.id,
        inviteCode: 'PUBLIC',
        isPublic: true,
        predictionSlots: 3,
        trackedDriverId: null,
      },
    ];
    for (const league of leagues) {
      const data = { ...league, seasonId: season.id };
      await prisma.league.upsert({ where: { id: league.id }, update: data, create: data });
    }

    // 3. Miembros (ids fijos porque league_members no tiene unique (leagueId, userId))
    const martinLeftAt =
      syncedRaces[Math.min(MARTIN_LEAVES_AFTER_RACE_INDEX, syncedRaces.length - 1)].raceStartAt ??
      new Date();
    const members = [
      { id: '00000000-0000-4000-8000-0000000001a1', leagueId: LEAGUE_AMIGOS, userId: TOMAS.id, role: 'admin', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000002a1', leagueId: LEAGUE_AMIGOS, userId: JUAN.id, role: 'member', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000003a1', leagueId: LEAGUE_AMIGOS, userId: LUCIA.id, role: 'member', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000004a1', leagueId: LEAGUE_AMIGOS, userId: MARTIN.id, role: 'member', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000001a2', leagueId: LEAGUE_PUBLICA, userId: TOMAS.id, role: 'member', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000002a2', leagueId: LEAGUE_PUBLICA, userId: JUAN.id, role: 'admin', leftAt: null },
      { id: '00000000-0000-4000-8000-0000000003a2', leagueId: LEAGUE_PUBLICA, userId: LUCIA.id, role: 'member', leftAt: null },
      // Martín dejó la Liga Pública a mitad de temporada: sirve para probar el filtro de standings.
      { id: '00000000-0000-4000-8000-0000000004a2', leagueId: LEAGUE_PUBLICA, userId: MARTIN.id, role: 'member', leftAt: martinLeftAt },
    ];
    for (const member of members) {
      await prisma.leagueMember.upsert({ where: { id: member.id }, update: member, create: member });
    }

    // 4. Predicciones de las carreras con resultados
    const maxSlots = Math.max(...leagues.map((l) => l.predictionSlots));
    const lastSyncedRaceId = syncedRaces[syncedRaces.length - 1].id;
    let predictionCount = 0;

    for (const [raceIndex, race] of syncedRaces.entries()) {
      if (!race.raceResult) continue;

      const finishingOrder = race.driverResults
        .filter((r) => r.position !== null)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map((r) => r.driverId);
      const trackedResult = trackedDriver
        ? race.driverResults.find((r) => r.driverId === trackedDriver.id)
        : undefined;

      const raceWithResults: RaceWithResults = {
        id: race.id,
        poleDriverId: race.raceResult.poleDriverId,
        safetyCar: race.raceResult.safetyCar,
        dnfCount: race.raceResult.dnfCount,
        finishingOrder,
        trackedDriverPosition: trackedResult?.position ?? null,
      };

      for (const user of USERS) {
        // Lucía no cargó predicción en la última fecha: caso "no participaste".
        if (user.id === LUCIA.id && race.id === lastSyncedRaceId) continue;

        // Igual que el front: una sola predicción por usuario, recortada según los slots de cada liga.
        const prediction = generatePrediction(
          createRandom(`${user.id}:${race.id}`),
          raceWithResults,
          maxSlots,
        );

        for (const league of leagues) {
          const isMember = members.some((m) => m.leagueId === league.id && m.userId === user.id);
          if (!isMember) continue;
          const leftBeforeThisRace =
            league.id === LEAGUE_PUBLICA &&
            user.id === MARTIN.id &&
            raceIndex > MARTIN_LEAVES_AFTER_RACE_INDEX;
          if (leftBeforeThisRace) continue;

          const data = {
            predictedOrder: prediction.predictedOrder.slice(0, league.predictionSlots),
            predictedPoleDriverId: prediction.predictedPoleDriverId,
            trackedDriverPosition: league.trackedDriverId ? prediction.trackedDriverPosition : null,
            safetyCar: prediction.safetyCar,
            dnfCount: prediction.dnfCount,
          };
          await prisma.prediction.upsert({
            where: {
              leagueId_raceId_userId: { leagueId: league.id, raceId: race.id, userId: user.id },
            },
            update: data,
            create: { ...data, leagueId: league.id, raceId: race.id, userId: user.id },
          });
          predictionCount++;
        }
      }
    }

    // 5. Predicción de Tomás para la próxima carrera (para ver que /predictions la carga)
    const nextRace = await prisma.race.findFirst({
      where: { seasonId: season.id, status: RaceStatus.SCHEDULED, raceStartAt: { gte: new Date() } },
      orderBy: { raceStartAt: 'asc' },
    });
    if (nextRace) {
      const random = createRandom(`${TOMAS.id}:${nextRace.id}`);
      const shuffled = [...drivers].sort(() => random() - 0.5).map((d) => d.id);
      for (const league of leagues) {
        const data = {
          predictedOrder: shuffled.slice(0, league.predictionSlots),
          predictedPoleDriverId: shuffled[0],
          trackedDriverPosition: league.trackedDriverId ? 12 : null,
          safetyCar: true,
          dnfCount: 2,
        };
        await prisma.prediction.upsert({
          where: {
            leagueId_raceId_userId: { leagueId: league.id, raceId: nextRace.id, userId: TOMAS.id },
          },
          update: data,
          create: { ...data, leagueId: league.id, raceId: nextRace.id, userId: TOMAS.id },
        });
        predictionCount++;
      }
    }

    console.log(
      `Seed OK: ${USERS.length} usuarios (password "${PASSWORD}"), ${leagues.length} ligas, ` +
        `${members.length} miembros, ${predictionCount} predicciones sobre ${syncedRaces.length} carreras.`,
    );
    if (!trackedDriver) {
      console.warn(`Aviso: no existe el piloto #${TRACKED_DRIVER_NUMBER}; la Liga Amigos queda sin piloto seguido.`);
    }
    console.log('Siguiente paso: GET /dev/calculate-score para calcular puntajes y rankings.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
