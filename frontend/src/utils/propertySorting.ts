import { Property } from '../types/property';

/**
 * Priority map for commercial status.
 * Lower number = Higher priority (appears first)
 */
const STATUS_PRIORITY: Record<string, number> = {
  'disponible': 0,
  'reservado': 1,
  'alquilado': 2,
  'vendido': 3,
  'traspasado': 4,
};

/**
 * Sorts an array of properties by availability, featured status, and date.
 * 1. Availability (Disponible first)
 * 2. Featured status
 * 3. Newest first
 */
export const sortPropertiesByAvailability = (properties: Property[]): Property[] => {
  return [...properties].sort((a, b) => {
    // 1. Sort by commercial status priority
    const priorityA = STATUS_PRIORITY[a.commercial_status] ?? 99;
    const priorityB = STATUS_PRIORITY[b.commercial_status] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2. If status is the same, sort by featured status
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }

    // 3. Finally, sort by creation date (newest first)
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
};
