// ============================================================================
// Automated Test Suite for Travel Reel → Multimodal Video Pipeline
// Tests:
// 1. DurationEngine (explicit, user selected, derived capacity)
// 2. DestinationResolver (evidence fusion, relative dates, seasonal candidates)
// 3. GeoOptimizer (Haversine distance, radius clustering, daily bin-packing)
// 4. ValidationEngine (consistency, deduplication, auto-repair)
// 5. BudgetEngine (ranges, shared vs individual per-person split)
// 6. TodoEngine (checklist lifecycle)
// 7. Full End-to-End Pipeline on Sample Reels (Bali, Swiss Music-Only, Manali Motivational)
// ============================================================================

import assert from 'assert';
import { DurationEngine } from '../src/lib/video-pipeline/durationEngine';
import { DestinationResolver } from '../src/lib/video-pipeline/destinationResolver';
import { GeoOptimizer } from '../src/lib/video-pipeline/geoOptimizer';
import { ValidationEngine } from '../src/lib/video-pipeline/validationEngine';
import { BudgetEngine } from '../src/lib/video-pipeline/budgetEngine';
import { TodoEngine } from '../src/lib/video-pipeline/todoEngine';
import { SAMPLE_REELS_CATALOG } from '../src/lib/video-pipeline/sampleReelsCatalog';
import { JobStore } from '../src/lib/video-pipeline/jobStore';
import { VideoPipelineOrchestrator } from '../src/lib/video-pipeline/orchestrator';

async function runTests() {
  console.log('🧪 Starting Travel Video Pipeline Verification Tests...\n');

  // --------------------------------------------------------------------------
  // Test 1: DurationEngine
  // --------------------------------------------------------------------------
  console.log('1️⃣ Testing DurationEngine:');
  const explicitRes = DurationEngine.calculateDuration(
    { days: 5, explicit: true },
    [],
    'balanced'
  );
  assert.strictEqual(explicitRes.durationDays, 5, 'Explicit duration must be honored');
  assert.strictEqual(explicitRes.source, 'creator_explicit');
  console.log('   ✓ Priority 1 (Creator Explicit 5 Days): PASSED');

  const mockPlaces = Array.from({ length: 8 }, (_, i) => ({
    name: `Spot ${i + 1}`,
    provenance: 'creator_visual' as const,
    source: 'visual' as const,
    confidence: 0.9,
    estimatedVisitMinutes: 90,
    lat: 35.6 + i * 0.02,
    lng: 139.7 + i * 0.02,
  }));

  const derivedRes = DurationEngine.calculateDuration(
    { days: null, explicit: false },
    mockPlaces,
    'balanced'
  );
  assert(derivedRes.durationDays >= 3 && derivedRes.durationDays <= 5, 'Derived days should be between 3 and 5 for 8 places');
  assert.strictEqual(derivedRes.source, 'derived_optimal');
  assert(derivedRes.averageHoursPerDay <= 9.0, 'Daily hours must not exceed realistic limit');
  console.log(`   ✓ Priority 3 (Derived Optimal for 8 places): PASSED -> ${derivedRes.durationDays} days (${derivedRes.averageHoursPerDay}h/day)`);

  // --------------------------------------------------------------------------
  // Test 2: DestinationResolver
  // --------------------------------------------------------------------------
  console.log('\n2️⃣ Testing DestinationResolver:');
  const fusedConf = DestinationResolver.fuseConfidences([0.9, 0.85]);
  assert(fusedConf >= 0.95 && fusedConf <= 1.0, 'Fused confidence of two strong signals must be >= 0.95');
  console.log(`   ✓ Multi-signal evidence fusion: PASSED -> ${fusedConf}`);

  const sampleSept = SAMPLE_REELS_CATALOG.find((s) => s.id === 'sample-september-recs')!;
  const dateRes = DestinationResolver.resolveDates(sampleSept.mockEvidence);
  assert.strictEqual(dateRes.month, 9, 'September must resolve to month 9');
  assert.strictEqual(dateRes.year, 2026, 'Year must resolve to current year 2026');
  console.log(`   ✓ Relative date resolution: PASSED -> Month ${dateRes.month}, Year ${dateRes.year}`);

  const destRes = DestinationResolver.resolveDestination(sampleSept.mockEvidence);
  assert(destRes.needsConfirmation, 'Seasonal recommendation must flag for user destination choice');
  assert(destRes.candidates.length >= 3, 'Must retain multiple candidates (Santorini, Kyoto, Bali)');
  console.log(`   ✓ Seasonal recommendation multi-candidate detection: PASSED -> ${destRes.candidates.length} candidates`);

  // --------------------------------------------------------------------------
  // Test 3: GeoOptimizer
  // --------------------------------------------------------------------------
  console.log('\n3️⃣ Testing GeoOptimizer:');
  const dist = GeoOptimizer.haversineDistanceKm(48.8584, 2.2945, 48.8606, 2.3376); // Eiffel Tower to Louvre
  assert(dist > 2.5 && dist < 4.0, `Distance between Eiffel Tower and Louvre should be ~3.2km, got ${dist}`);
  console.log(`   ✓ Haversine distance matrix: PASSED -> ${dist} km`);

  const optRes = GeoOptimizer.optimizeItinerary(mockPlaces, 3, 'balanced');
  assert.strictEqual(optRes.days.length, 3, 'Must produce 3 scheduled days');
  optRes.days.forEach((day) => {
    assert(day.totalVisitMinutes + day.totalTravelMinutes <= 480, `Day ${day.dayNumber} must not exceed daily capacity`);
  });
  console.log(`   ✓ Constrained greedy bin-packing: PASSED -> Score: ${optRes.objectiveScore}, Total distance: ${optRes.totalDistanceKm} km`);

  // --------------------------------------------------------------------------
  // Test 4: BudgetEngine
  // --------------------------------------------------------------------------
  console.log('\n4️⃣ Testing BudgetEngine:');
  const budget = BudgetEngine.calculateBudget('Bali, Indonesia', 5, 2, { budget: 'medium' }, 5);
  assert(budget.low < budget.estimated && budget.estimated < budget.high, 'Low < Estimated < High ranges');
  assert(budget.budget_per_person > 0, 'Must calculate per-person cost');
  assert.strictEqual(
    budget.estimated,
    budget.category_totals.stay +
      budget.category_totals.transport +
      budget.category_totals.food +
      budget.category_totals.activity +
      budget.category_totals.misc,
    'Category totals must strictly match total estimate'
  );
  console.log(`   ✓ Deterministic Budget Arithmetic: PASSED -> Estimated ₹${budget.estimated} (₹${budget.budget_per_person}/person)`);

  // --------------------------------------------------------------------------
  // Test 5: TodoEngine
  // --------------------------------------------------------------------------
  console.log('\n5️⃣ Testing TodoEngine:');
  const todos = TodoEngine.generateTodoList('Swiss Alps', 4, 6, ['Take the Berner Oberland pass']);
  assert(todos.length >= 6, 'Must generate at least 6 essential checklist tasks');
  assert(todos.some((t) => t.category === 'booking'), 'Must include hotel/transit booking');
  assert(todos.some((t) => t.category === 'gear'), 'Must include alpine gear tasks');
  console.log(`   ✓ Todo checklist generation: PASSED -> ${todos.length} actionable tasks`);

  // --------------------------------------------------------------------------
  // Test 6: ValidationEngine
  // --------------------------------------------------------------------------
  console.log('\n6️⃣ Testing ValidationEngine:');
  const rawPlan = {
    title: 'Test Trip',
    destination: 'Bali',
    durationDays: 2,
    days: [
      {
        dayNumber: 1,
        theme: 'Day 1',
        summary: 'Explore',
        mealSuggestions: {},
        practicalNote: 'Note',
        items: [
          {
            name: 'Uluwatu Temple',
            canonicalName: 'Uluwatu',
            timeSlot: 'morning' as const,
            startTime: '09:00',
            endTime: '11:00',
            durationMinutes: 120,
            travelMinutesFromPrevious: 20,
            notes: '',
            provenance: 'creator_visual' as const,
            sourceType: 'creator' as const,
            lat: -8.82,
            lng: 115.08,
            city: 'Bali',
            state: 'Bali',
            category: 'temple',
          },
          {
            name: 'Uluwatu Temple', // Duplicate
            canonicalName: 'Uluwatu',
            timeSlot: 'afternoon' as const,
            startTime: '13:00',
            endTime: '15:00',
            durationMinutes: 120,
            travelMinutesFromPrevious: 30,
            notes: '',
            provenance: 'creator_visual' as const,
            sourceType: 'creator' as const,
            lat: -8.82,
            lng: 115.08,
            city: 'Bali',
            state: 'Bali',
            category: 'temple',
          },
        ],
      },
      {
        dayNumber: 2,
        theme: 'Day 2',
        summary: 'Explore',
        mealSuggestions: {},
        practicalNote: 'Note',
        items: [],
      },
    ],
    tierUsed: 'test',
  };

  const { plan: repairedPlan, report } = ValidationEngine.validateAndRepair(rawPlan, 2, [
    { name: 'Uluwatu Temple', provenance: 'creator_visual', source: 'visual', confidence: 0.95 },
  ]);
  assert.strictEqual(report.duplicateAttractionsFound, 1, 'Validation engine must detect 1 duplicate attraction');
  assert.strictEqual(repairedPlan.days[0].items.length, 1, 'Duplicate must be removed');
  assert.strictEqual(report.preservedCreatorPlacesCount, 1, 'Creator place must be preserved');
  console.log('   ✓ Deterministic Validation & Auto-Repair: PASSED -> Duplicate pruned & creator place preserved');

  // --------------------------------------------------------------------------
  // Test 7: End-to-End Orchestrator on Sample Reels (Bali, Swiss Music-Only, Manali Motivational)
  // --------------------------------------------------------------------------
  console.log('\n7️⃣ Testing End-to-End Pipeline Orchestrator on Sample Reels:');

  // A. Bali 5-Day Trip
  console.log('   Running: 5-Day Bali Tropical Itinerary...');
  const jobBali = JobStore.createJob('sample-bali-5day');
  await VideoPipelineOrchestrator.executePipeline(jobBali.id);
  const finishedBali = JobStore.getJob(jobBali.id)!;
  assert.strictEqual(finishedBali.status, 'READY', `Bali job should finish with READY, got ${finishedBali.status}`);
  assert.strictEqual(finishedBali.trip?.durationDays, 5, 'Bali trip must have duration 5');
  assert(finishedBali.trip?.places.length >= 4, 'Bali trip must have at least 4 places');
  assert(finishedBali.trip?.places.some((p: any) => p.provenance === 'creator_visual' || p.provenance === 'creator_multiple'), 'Must preserve creator provenance');
  console.log(`   ✓ Bali 5-Day Reel: PASSED -> ${finishedBali.trip?.places.length} places across 5 days`);

  // B. Swiss Alps (Music-Only Video - Zero Voice!)
  console.log('   Running: Swiss Alps Pure Scenery Montage (Music Only - Zero Voice)...');
  const jobSwiss = JobStore.createJob('sample-swiss-music-only');
  await VideoPipelineOrchestrator.executePipeline(jobSwiss.id);
  const finishedSwiss = JobStore.getJob(jobSwiss.id)!;
  assert.strictEqual(finishedSwiss.status, 'READY', `Swiss music-only job should finish with READY, got ${finishedSwiss.status}`);
  assert(finishedSwiss.trip?.places.length >= 3, 'Must extract visual landmarks without voice');
  console.log(`   ✓ Swiss Alps Music-Only Reel: PASSED -> ${finishedSwiss.trip?.places.length} visual landmarks extracted`);

  // C. Manali Motivational Voiceover (Generic Speech filtered out)
  console.log('   Running: Manali Himalayan Escape (Motivational speech over drone footage)...');
  const jobManali = JobStore.createJob('sample-manali-motivational');
  await VideoPipelineOrchestrator.executePipeline(jobManali.id);
  const finishedManali = JobStore.getJob(jobManali.id)!;
  assert.strictEqual(finishedManali.status, 'READY', `Manali job should finish with READY, got ${finishedManali.status}`);
  assert(finishedManali.trip?.destinationRegion.toLowerCase().includes('manali'), 'Must resolve destination to Manali via visual/sign clues');
  console.log(`   ✓ Manali Motivational Reel: PASSED -> Destination resolved to "${finishedManali.trip?.destinationRegion}"`);

  console.log('\n🎉 ALL 7 TEST SUITES PASSED CLEANLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
