import { describeResultChanges, ResultSnapshot } from "./describe-result-changes";

const acronyms: Record<string, string> = { d1: 'VER', d2: 'LEC', d3: 'RUS', d4: 'HAM' };
const acronymOf = (driverId: string) => acronyms[driverId];

const base: ResultSnapshot = {
    poleDriverId: 'd1',
    safetyCar: false,
    dnfCount: 1,
    drivers: [
        { driverId: 'd1', position: 1, dnf: false },
        { driverId: 'd2', position: 2, dnf: false },
        { driverId: 'd3', position: 3, dnf: false },
        { driverId: 'd4', position: null, dnf: true },
    ],
};

describe('describeResultChanges', () => {
    it('should return nothing when the result is the same', () => {
        expect(describeResultChanges(base, { ...base, drivers: [...base.drivers].reverse() }, acronymOf)).toEqual([]);
    });

    it('should describe pole, positions, safety car and DNF changes', () => {
        const next: ResultSnapshot = {
            poleDriverId: 'd2',
            safetyCar: true,
            dnfCount: 2,
            drivers: [
                { driverId: 'd2', position: 1, dnf: false },
                { driverId: 'd1', position: 2, dnf: false },
                { driverId: 'd3', position: null, dnf: true }, // descalificado / abandono
                { driverId: 'd4', position: null, dnf: true },
            ],
        };

        expect(describeResultChanges(base, next, acronymOf)).toEqual([
            'Pole VER→LEC',
            'LEC P2→P1',
            'VER P1→P2',
            'RUS P3→DNF',
            'Safety Car No→Sí',
            'DNF 1→2',
        ]);
    });
});
