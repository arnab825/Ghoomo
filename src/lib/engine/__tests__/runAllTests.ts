import { testGraphValidator } from './graphValidator.test';
import { testMasteryPolicy } from './masteryPolicy.test';
import { testKnowledgeGapDetector } from './knowledgeGapDetector.test';
import { testAdaptiveRouter } from './adaptiveRouter.test';
import { runRouteEventsTests } from './routeEvents.test';
import { runEfficiencyTests } from './efficiency.test';
import { runMisconceptionTests } from './misconception.test';
import { runTwoLearnersSimulationTests } from './twoLearnersSimulation.test';
import { runAuthAndRlsTests } from './authAndRls.test';
import { runGoalAndActivityIntakeTests } from './goalAndActivityIntake.test';
import { runPerformanceAndOptimizationTests } from './performanceAndOptimization.test';
import './terminologyLeakage.test';
import './modelRouter.test';

console.log('====================================================');
console.log('  GHOOMO ADAPTIVE LEARNING NAVIGATION ENGINE TESTS');
console.log('  SIH 2026 Problem Statement 26207 Verification');
console.log('====================================================\n');

try {
  testGraphValidator();
  testMasteryPolicy();
  testKnowledgeGapDetector();
  testAdaptiveRouter();
  runRouteEventsTests();
  runEfficiencyTests();
  runMisconceptionTests();
  runTwoLearnersSimulationTests();
  runAuthAndRlsTests();
  runGoalAndActivityIntakeTests();
  runPerformanceAndOptimizationTests();

  console.log('\n====================================================');
  console.log('  ALL SUITES PASSED SUCCESSFULLY! (100% Deterministic)');
  console.log('====================================================\n');
  process.exit(0);
} catch (err: any) {
  console.error('\n❌ TEST FAILURE:', err.message);
  process.exit(1);
}
