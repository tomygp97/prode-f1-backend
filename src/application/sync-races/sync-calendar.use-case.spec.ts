import { OfficialResultsProvider, RaceMeetingData } from "../../domain/ports/official-results.provider";
import { RaceRepository } from "../../domain/ports/race.repository";
import { SyncCalendarUseCase } from './sync-calendar.use-case'

const mockOfficialResultsProvider: jest.Mocked<OfficialResultsProvider> = {
    getMeetings: jest.fn(),
    getSessionResults: jest.fn(),
    getDrivers: jest.fn(),
    hasRaceResults: jest.fn(),
    hasSafetyCar: jest.fn(),
}

const mockRaceRepository: jest.Mocked<RaceRepository> = {
  upsertFromMeeting: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByStatus: jest.fn(),
  findRacesPendingScoreCalculation: jest.fn(),
  markScoresCalculated: jest.fn(),
  findNext: jest.fn(),
  findScheduledBeforeDate: jest.fn(),
  findLockedRacesWithPastStartTime: jest.fn(),
  findRacesPendingResultsSync: jest.fn(),
  updateStatus: jest.fn(),
}

const fakeMeetings: RaceMeetingData[] = [
  {
    meetingKey: 1,
    name: 'Australian Grand Prix',
    circuit: 'Melbourne',
    country: 'Australia',
    qualifyingStartAt: new Date('2026-03-07'),
    raceStartAt: new Date('2026-03-08'),
    isCancelled: false,
    raceSessionKey: 111,
    qualifyingSessionKey: 222,
    latestSessionKey: 111,
  },
  {
    meetingKey: 2,
    name: 'Chinese Grand Prix',
    circuit: 'Shanghai',
    country: 'China',
    qualifyingStartAt: new Date('2026-03-14'),
    raceStartAt: new Date('2026-03-15'),
    isCancelled: false,
    raceSessionKey: 333,
    qualifyingSessionKey: 444,
    latestSessionKey: 333,
  },
  {
    meetingKey: 3,
    name: 'test Grand Prix',
    circuit: 'test',
    country: 'test',
    qualifyingStartAt: new Date('2026-03-15'),
    raceStartAt: null,
    isCancelled: true,
    raceSessionKey: 555,
    qualifyingSessionKey: 666,
    latestSessionKey: 666,
  },
];
  const disorderedMeetings: RaceMeetingData[] = [
    {
      meetingKey: 1,
      name: 'Australian Grand Prix',
      circuit: 'Melbourne',
      country: 'Australia',
      qualifyingStartAt: new Date('2026-03-08'),
      raceStartAt: new Date('2026-03-09'),
      isCancelled: false,
      raceSessionKey: 555,
      qualifyingSessionKey: 666,
      latestSessionKey: 111,
    },
    {
      meetingKey: 2,
      name: 'Chinese Grand Prix',
      circuit: 'Shanghai',
      country: 'China',
      qualifyingStartAt: new Date('2026-03-03'),
      raceStartAt: new Date('2026-03-04'),
      isCancelled: false,
      raceSessionKey: 555,
      qualifyingSessionKey: 666,
      latestSessionKey: 222,
    },
    {
      meetingKey: 3,
      name: 'test Grand Prix',
      circuit: 'test',
      country: 'test',
      qualifyingStartAt: new Date('2026-03-16'),
      raceStartAt: null,
      isCancelled: true,
      raceSessionKey: 555,
      qualifyingSessionKey: 666,
      latestSessionKey: 666,
    },
  ];

describe('SyncCalendarUseCase', () => {
    let useCase: SyncCalendarUseCase;

    beforeEach(() => {
        useCase = new SyncCalendarUseCase(mockRaceRepository, mockOfficialResultsProvider);
        jest.clearAllMocks();
    });

    it('should call upsertFromMeeting fro each meeting with correct round', async () => {
        mockOfficialResultsProvider.getMeetings.mockResolvedValue(fakeMeetings);
        mockRaceRepository.upsertFromMeeting.mockResolvedValue();

        await useCase.execute(2026, 'season-123');

        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledTimes(2);
        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledWith(
            fakeMeetings[0], 'season-123', 1
        );
        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledWith(
            fakeMeetings[1], 'season-123', 2
        );
        expect(mockRaceRepository.upsertFromMeeting).not.toHaveBeenCalledWith(
            fakeMeetings[2], 'season-123', 3
        );
    });

    it('should assing rounds in chronological order', async () => {
        mockOfficialResultsProvider.getMeetings.mockResolvedValue(disorderedMeetings);
        mockRaceRepository.upsertFromMeeting.mockResolvedValue();

        await useCase.execute(2026, 'season-123');

        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledTimes(2);
        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledWith(
            disorderedMeetings[0], 'season-123', 2
        );
        expect(mockRaceRepository.upsertFromMeeting).toHaveBeenCalledWith(
            disorderedMeetings[1], 'season-123', 1
        );
    });
})