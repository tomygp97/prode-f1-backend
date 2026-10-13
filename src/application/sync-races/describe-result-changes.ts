import { RaceResult } from '../../domain/entities/race-result.entity';
import { RaceDriverResult } from '../../domain/entities/race-driver-result.entity';

export interface ResultSnapshot {
    poleDriverId: string;
    safetyCar: boolean;
    dnfCount: number;
    drivers: { driverId: string; position: number | null; dnf: boolean }[];
}

export function snapshotOf(result: RaceResult, drivers: RaceDriverResult[]): ResultSnapshot {
    return {
        poleDriverId: result.poleDriverId,
        safetyCar: result.safetyCar,
        dnfCount: result.dnfCount,
        drivers: drivers.map((d) => ({ driverId: d.driverId, position: d.position, dnf: d.dnf })),
    };
}

// "P3", "P3 (DNF)", "DNF" o "—" si no figura
function placeLabel(driver: { position: number | null; dnf: boolean } | undefined): string {
    if (!driver) return '—';
    if (driver.position !== null) return `P${driver.position}${driver.dnf ? ' (DNF)' : ''}`;
    return driver.dnf ? 'DNF' : '—';
}

/**
 * Qué cambió entre el resultado guardado y el que trae OpenF1, en texto legible
 * (ej. "VER P1→P2"). Vacío si no cambió nada que afecte los puntos.
 */
export function describeResultChanges(
    previous: ResultSnapshot,
    next: ResultSnapshot,
    acronymOf: (driverId: string) => string,
): string[] {
    const changes: string[] = [];

    if (previous.poleDriverId !== next.poleDriverId) {
        changes.push(`Pole ${acronymOf(previous.poleDriverId)}→${acronymOf(next.poleDriverId)}`);
    }

    const previousById = new Map(previous.drivers.map((d) => [d.driverId, d]));
    const nextById = new Map(next.drivers.map((d) => [d.driverId, d]));
    const driverIds = [...new Set([...nextById.keys(), ...previousById.keys()])];
    // En el orden del resultado nuevo: los que suben o bajan se leen de arriba hacia abajo
    const order = (driverId: string) => nextById.get(driverId)?.position ?? Number.MAX_SAFE_INTEGER;
    for (const driverId of driverIds.sort((a, b) => order(a) - order(b))) {
        const before = placeLabel(previousById.get(driverId));
        const after = placeLabel(nextById.get(driverId));
        if (before !== after) changes.push(`${acronymOf(driverId)} ${before}→${after}`);
    }

    if (previous.safetyCar !== next.safetyCar) {
        changes.push(`Safety Car ${previous.safetyCar ? 'Sí' : 'No'}→${next.safetyCar ? 'Sí' : 'No'}`);
    }
    if (previous.dnfCount !== next.dnfCount) {
        changes.push(`DNF ${previous.dnfCount}→${next.dnfCount}`);
    }

    return changes;
}
