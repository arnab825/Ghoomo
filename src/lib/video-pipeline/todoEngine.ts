// ============================================================================
// Deterministic Todo Engine
// Specification Section 24:
// - Generates core logistical checklist tasks from itinerary state
// - Integrates destination-specific requirements (visa, high altitude, beach gear)
// - Manages task lifecycle: TODO, IN_PROGRESS, DONE
// ============================================================================

export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface GeneratedTodoItem {
  id: string;
  title: string;
  category: 'booking' | 'documents' | 'packing' | 'gear' | 'safety';
  status: TodoStatus;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
  notes?: string;
}

export class TodoEngine {
  /**
   * Generates deterministic travel checklist for trip
   */
  public static generateTodoList(
    destination: string,
    durationDays: number,
    travelMonth?: number | null,
    creatorTips: string[] = []
  ): GeneratedTodoItem[] {
    const todos: GeneratedTodoItem[] = [];
    const destLower = destination.toLowerCase();

    // 1. Core Bookings
    todos.push({
      id: `todo-hotel-${Date.now()}-1`,
      title: `Book accommodation in ${destination} (${durationDays} days)`,
      category: 'booking',
      status: 'TODO',
      completed: false,
      notes: 'Reserve rooms with free cancellation policy.',
    });

    todos.push({
      id: `todo-transit-${Date.now()}-2`,
      title: `Confirm flights / train tickets to ${destination}`,
      category: 'booking',
      status: 'TODO',
      completed: false,
    });

    // 2. Essential Documentation
    const isInternational =
      destLower.includes('japan') ||
      destLower.includes('switzerland') ||
      destLower.includes('france') ||
      destLower.includes('paris') ||
      destLower.includes('greece') ||
      destLower.includes('indonesia') ||
      destLower.includes('bali');

    if (isInternational) {
      todos.push({
        id: `todo-passport-${Date.now()}-3`,
        title: 'Check passport validity (minimum 6 months from travel date)',
        category: 'documents',
        status: 'TODO',
        completed: false,
      });

      todos.push({
        id: `todo-visa-${Date.now()}-4`,
        title: `Verify tourist visa or eVisa requirements for ${destination}`,
        category: 'documents',
        status: 'TODO',
        completed: false,
      });

      todos.push({
        id: `todo-insurance-${Date.now()}-5`,
        title: 'Purchase international travel & medical insurance',
        category: 'safety',
        status: 'TODO',
        completed: false,
      });
    } else {
      todos.push({
        id: `todo-id-${Date.now()}-6`,
        title: 'Keep physical Aadhaar / Government Photo ID ready for hotel check-ins',
        category: 'documents',
        status: 'TODO',
        completed: false,
      });
    }

    // 3. Destination-Specific Gear & Packing
    if (destLower.includes('manali') || destLower.includes('ladakh') || destLower.includes('spiti') || destLower.includes('swiss') || destLower.includes('alps')) {
      todos.push({
        id: `todo-cold-${Date.now()}-7`,
        title: 'Pack thermal base layers, waterproof jacket, and sturdy trekking shoes',
        category: 'gear',
        status: 'TODO',
        completed: false,
      });
      todos.push({
        id: `todo-altitude-${Date.now()}-8`,
        title: 'Keep Diamox / altitude sickness medication and hydration salts',
        category: 'safety',
        status: 'TODO',
        completed: false,
      });
    } else if (destLower.includes('bali') || destLower.includes('beach') || destLower.includes('santorini') || destLower.includes('goa')) {
      todos.push({
        id: `todo-beach-${Date.now()}-9`,
        title: 'Pack high-SPF reef-safe sunscreen, swimwear, and dry bag',
        category: 'packing',
        status: 'TODO',
        completed: false,
      });
    }

    // 4. Practical Navigation
    todos.push({
      id: `todo-maps-${Date.now()}-10`,
      title: `Download offline OpenStreetMap / Google Maps for ${destination}`,
      category: 'gear',
      status: 'TODO',
      completed: false,
    });

    // 5. Creator Specific Recommendations
    creatorTips.slice(0, 2).forEach((tip, idx) => {
      todos.push({
        id: `todo-creator-${Date.now()}-${idx + 11}`,
        title: `Creator Tip: ${tip}`,
        category: 'booking',
        status: 'TODO',
        completed: false,
        notes: 'Highlighted directly from travel video footage.',
      });
    });

    return todos;
  }
}
