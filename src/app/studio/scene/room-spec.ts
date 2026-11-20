/**
 * Authoritative geometry for the first-person OSCE BLS room.
 * Coordinates: X east, Y up, Z south; north is -Z.
 * Room origin is the centre of the floor.
 * The mannequin lies head-north (negative Z), feet-south (positive Z).
 */

export type Vec3 = readonly [number, number, number];

export type RoomObjectSpec = {
  id: string;
  label: string;
  position: Vec3;
  size: Vec3;
  rotationY?: number;
  interactive?: boolean;
  zone?: 'student' | 'apk' | 'staff' | 'none';
};

export const ROOM_SPEC = {
  id: 'OSCE_Station_BLSR_Airway_360',
  units: 'meters',
  dimensions: { width: 5, depth: 5, height: 3 },
  axes: { east: '+X', west: '-X', south: '+Z', north: '-Z' },
  camera: { position: [0, 1.6, 0] as Vec3, fov: 90, mode: 'first-person' as const },
  materials: {
    floor: { color: '#C9C4BC', roughness: 0.85 },
    walls: { color: '#F5F5F2', roughness: 0.9 },
    ceiling: { color: '#FFFFFF', roughness: 0.95 },
    furniture: { color: '#E6E1D8', roughness: 0.7 },
  },
  lighting: { colorTemperatureK: 4300, ceilingLights: 4, targetLux: 500, softShadows: true },
  objects: [
    { id: 'mat_patient', label: 'Коврик для манекена', position: [-0.6, 0.01, 0], size: [0.8, 0.02, 1.9], zone: 'student' },
    { id: 'mat_rescuer', label: 'Коврик аккредитуемого', position: [0.7, 0.01, 0], size: [0.7, 0.02, 1.5], zone: 'student' },

    // Local longitudinal axis is Z. Rotation 0 keeps head at -Z and feet at +Z.
    { id: 'manikin_cpr', label: 'Взрослый манекен для СЛР', position: [-0.6, 0.13, 0], size: [0.45, 0.25, 1.75], rotationY: 0, interactive: true, zone: 'student' },
    { id: 'manikin_choking_vest', label: 'Тренажёр-жилет для удаления инородного тела', position: [-1.45, 0.13, 1.05], size: [0.45, 0.25, 0.95], interactive: true, zone: 'student' },

    { id: 'phone', label: 'Мобильный телефон', position: [0.15, 0.035, 0.92], size: [0.08, 0.02, 0.16], interactive: true, zone: 'student' },
    { id: 'aed', label: 'Учебный АНД', position: [0.95, 0.48, 0.88], size: [0.42, 0.25, 0.32], interactive: true, zone: 'student' },
    { id: 'antiseptic_stand', label: 'Подставка с антисептиком и салфетками', position: [1.35, 0.28, -1.45], size: [0.35, 0.55, 0.3], interactive: true, zone: 'student' },

    { id: 'apk_desk', label: 'Стол члена АПК', position: [2.0, 0.75, -0.8], size: [1.2, 0.75, 0.6], rotationY: 90, zone: 'apk' },
    { id: 'apk_chair_1', label: 'Стул члена АПК 1', position: [2.0, 0.45, -1.5], size: [0.45, 0.9, 0.45], zone: 'apk' },
    { id: 'apk_chair_2', label: 'Стул члена АПК 2', position: [2.0, 0.45, -0.1], size: [0.45, 0.9, 0.45], zone: 'apk' },
    { id: 'apk_pc', label: 'Компьютер члена АПК', position: [2.0, 1.1, -0.8], size: [0.5, 0.4, 0.1], rotationY: 90, zone: 'apk' },
    { id: 'apk_pc_cpr', label: 'Монитор регистрации параметров СЛР', position: [2.0, 1.1, -1.2], size: [0.5, 0.4, 0.1], rotationY: 90, zone: 'apk' },
    { id: 'apk_camera', label: 'Камера трансляции', position: [2.3, 2.4, -0.8], size: [0.1, 0.1, 0.15], rotationY: 180, zone: 'apk' },

    { id: 'tech_camera', label: 'Техническая видеокамера', position: [0, 2.8, 2.3], size: [0.08, 0.08, 0.12], zone: 'staff' },
    { id: 'tech_shelf', label: 'Техническая полка', position: [0.9, 0.9, 2.25], size: [0.8, 0.12, 0.35], zone: 'staff' },

    { id: 'door', label: 'Входная дверь и выход на следующую станцию', position: [-2.2, 1.05, -2.49], size: [0.9, 2.1, 0.05], interactive: true, zone: 'student' },
    { id: 'info_screen', label: 'Экран брифинга станции', position: [-2.49, 1.6, 0], size: [0.7, 0.45, 0.03], rotationY: 90, zone: 'none' },
    { id: 'wall_clock', label: 'Настенный таймер', position: [-2.49, 2.0, 0.9], size: [0.25, 0.25, 0.05], rotationY: 90, zone: 'none' },
  ] satisfies RoomObjectSpec[],
  interactionZones: [
    { id: 'zone_rescuer', center: [0.7, 0, 0] as Vec3, radius: 1, access: 'student' },
    { id: 'zone_apk', center: [2, 0, -0.8] as Vec3, radius: 0.8, access: 'apk' },
    { id: 'zone_tech', center: [0, 0, 2.2] as Vec3, radius: 0.6, access: 'staff' },
  ],
  exam: {
    durationSeconds: 510,
    transitionAtSeconds: 540,
    announcements: [
      { at: 0, text: 'Ознакомьтесь с заданием станции' },
      { at: 30, text: 'Войдите на станцию и озвучьте свой логин' },
      { at: 480, text: 'У Вас осталась одна минута' },
      { at: 540, text: 'Перейдите на следующую станцию' },
    ],
  },
} as const;
