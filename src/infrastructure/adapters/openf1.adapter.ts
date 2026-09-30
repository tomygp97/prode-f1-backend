import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type { OfficialResultsProvider, RaceMeetingData, DriverData, DriverSessionResult } from '../../domain/ports/official-results.provider';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const MAX_RETRIES = 5;

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

@Injectable()
export class OpenF1Adapter implements OfficialResultsProvider {
    private readonly logger = new Logger(OpenF1Adapter.name);

    // Backoff exponencial ante 429 (2s, 4s, 8s, 16s, 32s), respetando Retry-After si viene
    private async executeWithRetry<T>(
        request: () => Promise<T>,
        retries = MAX_RETRIES,
    ): Promise<T> {
        try {
            return await request();
        } catch (error) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 429 &&
                retries > 0
            ) {
                const attempt = MAX_RETRIES - retries + 1;
                const retryAfterSeconds = Number(error.response.headers?.['retry-after']);
                const delaySeconds = retryAfterSeconds > 0 ? retryAfterSeconds : 2 ** attempt;

                this.logger.warn(
                    `OpenF1 rate limit reached. Retry ${attempt}/${MAX_RETRIES} in ${delaySeconds} seconds...`,
                );

                await new Promise<void>(resolve => setTimeout(resolve, delaySeconds * 1000));

                return this.executeWithRetry(request, retries - 1);
            }

            throw error;
        }
    }

    // OpenF1 responde 404 {"detail":"No results found."} cuando una sesión todavía no tiene datos
    private async getList<T>(url: string): Promise<T[]> {
        return this.executeWithRetry(async () => {
            try {
                const res = await axios.get(url);
                return Array.isArray(res.data) ? (res.data as T[]) : [];
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) return [];
                throw error;
            }
        });
    }

    async getMeetings(year: number): Promise<RaceMeetingData[]> {
        return this.executeWithRetry(async () => {
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
        });
    }

    async getSessionResults(sessionKey: number): Promise<DriverSessionResult[]> {
        const results = await this.getList<any>(
            `${OPENF1_BASE_URL}/session_result?session_key=${sessionKey}`
        );

        return results.map((entry) => ({
            externalDriverNumber: entry.driver_number,
            position: entry.position,
            dnf: entry.dnf,
        }));
    }

    async hasRaceResults(sessionKey: number): Promise<boolean> {
        const results = await this.getSessionResults(sessionKey);
        return results.length > 0;
    }

    async hasSafetyCar(sessionKey: number): Promise<boolean> {
        return this.executeWithRetry(async () => {
            const res = await axios.get(`${OPENF1_BASE_URL}/race_control?session_key=${sessionKey}&category=SafetyCar`);
                        return res.data.some(
                (entry: { message: string }) => entry.message === 'SAFETY CAR DEPLOYED'
            );
        })
    }

    async getDrivers(sessionKey: number): Promise<DriverData[]> {
        const drivers = await this.getList<any>(
            `${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`
        );

        return drivers.map((d) => ({
            driverNumber: d.driver_number,
            fullName: d.full_name,
            acronym: d.name_acronym,
            teamName: d.team_name,
            teamColour: d.team_colour,
        }));
    }

    async getLatestStartedSessionKey(filter: { meetingKey?: number; year?: number }): Promise<number | null> {
        const params = [
            filter.meetingKey ? `meeting_key=${filter.meetingKey}` : null,
            filter.year ? `year=${filter.year}` : null,
            `date_start<=${new Date().toISOString().slice(0, 19)}`,
        ].filter(Boolean);

        const sessions = await this.getList<OpenF1Session>(`${OPENF1_BASE_URL}/sessions?${params.join('&')}`);

        const latest = sessions.reduce<OpenF1Session | null>(
            (acc, s) => (!acc || new Date(s.date_start) > new Date(acc.date_start) ? s : acc),
            null,
        );
        return latest?.session_key ?? null;
    }
}