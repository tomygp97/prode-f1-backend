import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { OfficialResultsProvider, RaceMeetingData, DriverPositionData, DriverData } from '../../domain/ports/official-results.provider';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

interface OpenF1Meeting {
    meeting_key: number;
    meeting_name: string;
    circuit_short_name: string;
    country_name: string;
    is_cancelled: boolean;
};

interface OpenF1Session {
    session_key: number;
    meeting_key: number;
    session_name: string;
    date_start: string;
};

interface OpenF1Position {
    driver_number: number;
    position: number;
};

@Injectable()
export class OpenF1Adapter implements OfficialResultsProvider {
    async getMeetings(year: number): Promise<RaceMeetingData[]> {
        const [meetingsRes, sessionsRes] = await Promise.all([
            axios.get<OpenF1Meeting[]>(`${OPENF1_BASE_URL}/meetings?year=${year}`),
            axios.get<OpenF1Session[]>(`${OPENF1_BASE_URL}/sessions?year=${year}`),
        ]);

        const meetings = meetingsRes.data.filter(m => m.meeting_name.includes('Grand Prix'));
        const sessions = sessionsRes.data;



        return meetings.map(meeting => {
            const qualifying = sessions.find(
                s => s.meeting_key === meeting.meeting_key && s.session_name === 'Qualifying'
            );

            const race = sessions.find(
                s => s.meeting_key === meeting.meeting_key && s.session_name === 'Race'
            );

            const latestSession = sessions
            .filter(s => s.meeting_key === meeting.meeting_key)
            .reduce<OpenF1Session | null>((latest, current) => {
                if (!latest) return current;
        
                return new Date(current.date_start) > new Date(latest.date_start)
                    ? current
                    : latest;
            }, null);

            return {
                meetingKey: meeting.meeting_key,
                raceSessionKey: race ? race.session_key : null,
                qualifyingSessionKey: qualifying ? qualifying.session_key : null,
                latestSessionKey: latestSession?.session_key ?? null,
                name: meeting.meeting_name,
                circuit: meeting.circuit_short_name,
                country: meeting.country_name,
                qualifyingStartAt: qualifying ? new Date(qualifying.date_start) : null,
                raceStartAt: race ? new Date(race.date_start) : null,
                isCancelled: meeting.is_cancelled,
            };
        });
    }

    async getDriverPositions(sessionKey: number): Promise<DriverPositionData[]> {
        const res = await axios.get<OpenF1Position[]>(
            `${OPENF1_BASE_URL}/position?session_key=${sessionKey}&position<=20`
        );

        // OpenF1 devuelve múltiples entradas por piloto (una por vuelta), nos quedamos con la última posición de cada uno
        const latest = new Map<number, OpenF1Position>();
        for (const entry of res.data) {
            latest.set(entry.driver_number, entry);
        }

        return Array.from(latest.values()).map(entry => ({
            externalDriverNumber: entry.driver_number,
            position: entry.position,
            dnf: false, //TODO: Lo refinamos cuando tengamos race_control
        }))
    }

    async hasRaceResults(sessionKey: number): Promise<boolean> {
        const res = await axios.get<OpenF1Position[]>(
            `${OPENF1_BASE_URL}/position?session_key=${sessionKey}`
        );

        if (res.data.length === 0) return false;

        const uniqueDrivers = new Set(res.data.map(p => p.driver_number));
        return uniqueDrivers.size >= 18;
    }

    async hasSafetyCar(sessionKey: number): Promise<boolean> {
        const res = await axios.get(`${OPENF1_BASE_URL}/race_control?session_key=${sessionKey}&category=SafetyCar`);

        return res.data.some(
            (entry: { message: string }) => entry.message === 'SAFETY CAR DEPLOYED'
        );
    }

    async getDrivers(sessionKey: number): Promise<DriverData[]> {
        const res = await axios.get(
            `${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`
        );

        return res.data.map((d: any) => ({
            driverNumber: d.driver_number,
            fullName: d.full_name,
            acronym: d.name_acronym,
            teamName: d.team_name,
            teamColour: d.team_colour,
        }));
    }
}