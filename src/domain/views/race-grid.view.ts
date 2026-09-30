/** Piloto de la grilla de una carrera, listo para mostrar (con datos del piloto y del equipo). */
export interface RaceGridEntryView {
  driverId: string;
  driverNumber: number;
  name: string;
  acronym: string;
  team: {
    id: string;
    name: string;
    colour: string;
  };
}
