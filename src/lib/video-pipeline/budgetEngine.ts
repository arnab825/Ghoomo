// ============================================================================
// Deterministic Budget Engine
// Specification Sections 21 & 22:
// - Low / Estimated / High cost ranges (no false precision)
// - Breakdown across Stay, Transport, Food, Activities, Misc
// - Per-person cost calculation with separation of shared vs individual costs
// - Zero LLM arithmetic errors
// ============================================================================

import { BudgetEstimateBreakdown, PipelinePreferences } from '../types/travelVideoPipeline';

export class BudgetEngine {
  /**
   * Computes deterministic budget estimate with per-person separation
   */
  public static calculateBudget(
    destination: string,
    durationDays: number,
    travellers = 2,
    preferences: PipelinePreferences = {},
    placesCount = 6
  ): BudgetEstimateBreakdown {
    const days = Math.max(1, durationDays);
    const people = Math.max(1, travellers);
    const roomsCount = Math.ceil(people / 2); // 2 persons per hotel room

    // Tier multipliers based on user preference
    const budgetLevel = preferences.budget || 'medium';
    const isBudget = budgetLevel === 'budget';
    const isLuxury = budgetLevel === 'luxury';

    // Base rates per unit in INR (adjusted by international destination tier if applicable)
    const isInternational =
      destination.toLowerCase().includes('japan') ||
      destination.toLowerCase().includes('switzerland') ||
      destination.toLowerCase().includes('paris') ||
      destination.toLowerCase().includes('france') ||
      destination.toLowerCase().includes('greece') ||
      destination.toLowerCase().includes('bali');

    const destMultiplier = isInternational ? 2.5 : 1.0;

    // 1. Shared Costs
    // Room rate per night in INR:
    const roomRatePerNight = isBudget
      ? 1800 * destMultiplier
      : isLuxury
      ? 8000 * destMultiplier
      : 3500 * destMultiplier;
    const totalAccommodation = Math.round(roomsCount * roomRatePerNight * (days - 1 || 1));

    // Shared transport (cabs / car rental / airport transfers):
    const dailyCabRate = isBudget
      ? 1200 * destMultiplier
      : isLuxury
      ? 4500 * destMultiplier
      : 2400 * destMultiplier;
    const totalSharedTransport = Math.round(dailyCabRate * days);

    // Guide / private activity bookings:
    const guideCosts = isLuxury ? 5000 * destMultiplier : isBudget ? 0 : 1500 * destMultiplier;

    const totalShared = totalAccommodation + totalSharedTransport + guideCosts;

    // 2. Individual Costs per Person
    // Food per person per day:
    const foodPerPersonDay = isBudget
      ? 600 * destMultiplier
      : isLuxury
      ? 3000 * destMultiplier
      : 1200 * destMultiplier;
    const totalFoodPerPerson = Math.round(foodPerPersonDay * days);

    // Entry tickets per person (across all attractions):
    const avgTicketPerPlace = isBudget
      ? 150 * destMultiplier
      : isLuxury
      ? 800 * destMultiplier
      : 400 * destMultiplier;
    const totalTicketsPerPerson = Math.round(placesCount * avgTicketPerPlace);

    // Personal shopping and misc:
    const miscPerPerson = isBudget
      ? 800 * destMultiplier
      : isLuxury
      ? 4000 * destMultiplier
      : 1800 * destMultiplier;

    const totalIndividualPerPerson = totalFoodPerPerson + totalTicketsPerPerson + miscPerPerson;

    // 3. Totals
    const totalIndividualAll = totalIndividualPerPerson * people;
    const estimatedTotal = Math.round(totalShared + totalIndividualAll);

    // Ranges: low = -18%, high = +25%
    const low = Math.round(estimatedTotal * 0.82);
    const high = Math.round(estimatedTotal * 1.25);

    const budgetPerPerson = Math.round(totalShared / people + totalIndividualPerPerson);

    return {
      currency: 'INR',
      low,
      estimated: estimatedTotal,
      high,
      shared_costs: {
        accommodation: totalAccommodation,
        private_transport: totalSharedTransport,
        guide_activities: guideCosts,
      },
      individual_costs_per_person: {
        food: totalFoodPerPerson,
        entry_tickets: totalTicketsPerPerson,
        personal_misc: miscPerPerson,
      },
      total_trip_budget: estimatedTotal,
      budget_per_person: budgetPerPerson,
      category_totals: {
        stay: totalAccommodation,
        transport: totalSharedTransport,
        food: totalFoodPerPerson * people,
        activity: guideCosts + totalTicketsPerPerson * people,
        misc: miscPerPerson * people,
      },
    };
  }
}
