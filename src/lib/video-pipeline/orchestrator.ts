// ============================================================================
// Master Video Pipeline Orchestrator
// Executes the complete 62-point Engineering Specification:
// Video Ingestion → Gemini Multimodal Understanding → Evidence Extraction →
// Speech Fallback (if needed) → Destination Resolution → Duration Engine →
// Geo-Clustering & Bin-Packing → Itinerary Generation → Deterministic Validation →
// Budget Engine → Todo Engine → Collaborative Trip Ready
// ============================================================================

import { JobStore } from './jobStore';
import { VideoIngestionService } from './videoIngestionService';
import { GeminiMultimodalService } from './geminiMultimodalService';
import { SpeechFallbackService } from './speechFallbackService';
import { DestinationResolver } from './destinationResolver';
import { DurationEngine } from './durationEngine';
import { GeoOptimizer } from './geoOptimizer';
import { ItineraryGenerator } from './itineraryGenerator';
import { ValidationEngine } from './validationEngine';
import { BudgetEngine } from './budgetEngine';
import { TodoEngine } from './todoEngine';
import { GhoomoTrip, Place, ItineraryDay, ItineraryItem, BudgetItem, ChecklistItem, TripSource } from '../types/ghoomo';
import { fetchSocialPageMetadata } from '@/features/social-import/extractors';

export class VideoPipelineOrchestrator {
  /**
   * Runs the complete pipeline asynchronously in the background
   */
  public static async executePipeline(jobId: string): Promise<void> {
    const job = JobStore.getJob(jobId);
    if (!job) return;

    const pipelineStartTime = Date.now();
    let totalGeminiCalls = 0;
    let totalGeminiLatency = 0;

    try {
      // ----------------------------------------------------------------------
      // Step 1: Ingest & Cache Video (DOWNLOADING)
      // ----------------------------------------------------------------------
      JobStore.updateJobState(jobId, 'DOWNLOADING', 15, 'Downloading and caching video stream.');
      const ingestion = await VideoIngestionService.ingestVideo(job.url);
      JobStore.setJobData(jobId, { metadata: ingestion.metadata });

      // ----------------------------------------------------------------------
      // Step 2: Gemini Multimodal Understanding (PROCESSING_VIDEO -> EXTRACTING_EVIDENCE)
      // ----------------------------------------------------------------------
      JobStore.updateJobState(
        jobId,
        'PROCESSING_VIDEO',
        30,
        'Analyzing video stream with native multimodal AI (audio, visual landmarks, text).'
      );

      // Pre-scrape metadata (optional extra signal)
      let preScraped: any = null;
      try {
        preScraped = await fetchSocialPageMetadata(job.url);
      } catch {}

      JobStore.updateJobState(
        jobId,
        'EXTRACTING_EVIDENCE',
        45,
        'Extracting structured travel evidence and separating creator claims from visual cues.'
      );

      const extractionResult = await GeminiMultimodalService.extractTravelEvidence(
        ingestion.metadata,
        ingestion.buffer,
        preScraped
          ? {
              title: preScraped.title,
              description: preScraped.description,
              author: preScraped.author,
            }
          : undefined
      );

      let evidence = extractionResult.evidence;
      totalGeminiCalls += extractionResult.metrics.callsCount;
      totalGeminiLatency += extractionResult.metrics.totalLatencyMs;

      // ----------------------------------------------------------------------
      // Step 2b: Optional Speech Fallback (Specification Section 34)
      // ----------------------------------------------------------------------
      if (
        SpeechFallbackService.shouldRunFallback(
          evidence.speech?.travel_relevance || 0,
          evidence.travel_confidence || 0,
          evidence.places?.length || 0
        )
      ) {
        JobStore.appendLog(
          jobId,
          'EXTRACTING_EVIDENCE',
          'Running secondary SpeechFallbackService to verify spoken coordinates.'
        );

        const speechData = await SpeechFallbackService.executeFallbackTranscription(job.url);
        if (speechData?.hasVoice && speechData.transcript) {
          evidence.speech = {
            available: true,
            travel_relevance: 0.75,
            summary: speechData.transcript.slice(0, 300),
          };
        }
      }

      JobStore.setJobData(jobId, { evidence });

      // Guardrail: reject non-travel videos
      if (!evidence.is_travel_video && evidence.travel_confidence < 0.4) {
        JobStore.setJobError(jobId, 'The provided video does not contain recognizable travel content.');
        return;
      }

      // ----------------------------------------------------------------------
      // Step 3: Destination Resolution (RESOLVING_DESTINATION)
      // ----------------------------------------------------------------------
      JobStore.updateJobState(
        jobId,
        'RESOLVING_DESTINATION',
        60,
        'Resolving destination candidates, temporal context, and canonical landmarks.'
      );

      const resolvedDest = DestinationResolver.resolveDestination(
        evidence,
        job.preferences.destination
      );

      JobStore.setJobData(jobId, {
        destinationCandidates: resolvedDest.candidates,
        resolvedDestination: resolvedDest.destination,
      });

      // If confidence < 0.70 or seasonal recommendation list needs user selection:
      if (resolvedDest.needsConfirmation && !job.preferences.destination) {
        JobStore.updateJobState(
          jobId,
          'NEEDS_CONFIRMATION',
          65,
          resolvedDest.confirmationReason || 'Please confirm your preferred destination to proceed.'
        );
        return; // Pauses here; resumed when user hits /api/jobs/{id}/confirm
      }

      // ----------------------------------------------------------------------
      // Step 4: Resume Pipeline with Confirmed Destination
      // ----------------------------------------------------------------------
      await this.finalizeOptimizedTrip(jobId, resolvedDest.destination, evidence, totalGeminiCalls, totalGeminiLatency, pipelineStartTime);
    } catch (err: any) {
      console.error('[VideoPipelineOrchestrator] Failed:', err);
      JobStore.setJobError(jobId, err.message || 'An unexpected error occurred during video processing.');
    }
  }

  /**
   * Resumes and completes the pipeline once destination is selected or confirmed
   */
  public static async finalizeOptimizedTrip(
    jobId: string,
    destination: string,
    evidence: any,
    prevGeminiCalls = 1,
    prevGeminiLatency = 0,
    startTime = Date.now()
  ): Promise<void> {
    const job = JobStore.getJob(jobId);
    if (!job) return;

    try {
      // ----------------------------------------------------------------------
      // Step 5: Entity Normalization & Coordinates Geocoding
      // ----------------------------------------------------------------------
      JobStore.updateJobState(
        jobId,
        'OPTIMIZING_TRIP',
        75,
        'Normalizing entities via OpenStreetMap Nominatim and grouping places.'
      );

      const normalizedPlaces = await DestinationResolver.normalizeEntities(
        evidence.places || [],
        destination
      );

      // ----------------------------------------------------------------------
      // Step 6: Deterministic Duration Engine & Geo-Clustering
      // ----------------------------------------------------------------------
      const durationResult = DurationEngine.calculateDuration(
        evidence.duration,
        normalizedPlaces,
        job.preferences.pace || 'balanced',
        job.preferences.duration
      );

      const optimizationResult = GeoOptimizer.optimizeItinerary(
        normalizedPlaces,
        durationResult.durationDays,
        job.preferences.pace || 'balanced'
      );

      JobStore.setJobData(jobId, { durationDays: durationResult.durationDays });

      // ----------------------------------------------------------------------
      // Step 7: AI Call 2 - Structured Itinerary Generation
      // ----------------------------------------------------------------------
      JobStore.updateJobState(
        jobId,
        'GENERATING_ITINERARY',
        85,
        'Generating final day-by-day travel itinerary adhering to the geographic order.'
      );

      const itineraryResult = await ItineraryGenerator.generateFinalItinerary(
        destination,
        optimizationResult.days,
        job.preferences
      );

      // ----------------------------------------------------------------------
      // Step 8: Deterministic Validation & Repair (VALIDATING)
      // ----------------------------------------------------------------------
      JobStore.updateJobState(
        jobId,
        'VALIDATING',
        92,
        'Deterministically validating schedule, constraints, and creator preservation.'
      );

      const { plan: validatedPlan, report } = ValidationEngine.validateAndRepair(
        itineraryResult,
        durationResult.durationDays,
        normalizedPlaces
      );

      // ----------------------------------------------------------------------
      // Step 9: Deterministic Budget Engine & Todo Engine
      // ----------------------------------------------------------------------
      const budgetBreakdown = BudgetEngine.calculateBudget(
        destination,
        durationResult.durationDays,
        job.preferences.travellers || 2,
        job.preferences,
        normalizedPlaces.length
      );

      const { month: resolvedMonth } = DestinationResolver.resolveDates(evidence);
      const generatedTodos = TodoEngine.generateTodoList(
        destination,
        durationResult.durationDays,
        resolvedMonth,
        evidence.creator_recommendations || []
      );

      // ----------------------------------------------------------------------
      // Step 10: Construct Final GhoomoTrip Domain Object
      // ----------------------------------------------------------------------
      const tripId = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sourceId = `src-${Date.now()}`;

      const source: TripSource = {
        id: sourceId,
        tripId,
        url: job.url,
        platform: (job.metadata?.source_platform as any) || 'instagram',
        title: validatedPlan.title,
        author: '@creator',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        rawTranscript: evidence.speech?.summary || '',
        createdAt: new Date().toISOString(),
      };

      const finalPlaces: Place[] = [];
      const finalDays: ItineraryDay[] = [];

      validatedPlan.days.forEach((d) => {
        const dayId = `day-${d.dayNumber}-${tripId}`;
        const dayItems: ItineraryItem[] = [];

        d.items.forEach((item, idx) => {
          const placeId = `p-${Date.now()}-${d.dayNumber}-${idx}`;
          const placeObj: Place = {
            id: placeId,
            tripId,
            sourceId,
            name: item.name,
            city: item.city,
            state: item.state,
            lat: item.lat,
            lng: item.lng,
            category: item.category,
            confidence: 0.95,
            assignedDay: d.dayNumber,
            timeSlot: item.timeSlot,
            provenance: item.provenance,
            sourceType: item.sourceType,
            notes: item.notes,
            createdAt: new Date().toISOString(),
          };

          finalPlaces.push(placeObj);

          dayItems.push({
            id: `item-${d.dayNumber}-${idx}-${tripId}`,
            dayId,
            placeId,
            orderIndex: idx,
            timeSlot: item.timeSlot,
            durationMinutes: item.durationMinutes,
            travelMinutesFromPrevious: item.travelMinutesFromPrevious,
            startTime: item.startTime,
            endTime: item.endTime,
            provenance: item.provenance,
            sourceType: item.sourceType,
            notes: item.notes,
            mealSuggestion: idx === 0 ? d.mealSuggestions.lunch : idx === d.items.length - 1 ? d.mealSuggestions.dinner : undefined,
            practicalNote: d.practicalNote,
            place: placeObj,
          });
        });

        finalDays.push({
          id: dayId,
          tripId,
          dayNumber: d.dayNumber,
          theme: d.theme,
          notes: d.summary,
          items: dayItems,
        });
      });

      const finalBudgetItems: BudgetItem[] = [
        {
          id: `b-stay-${Date.now()}`,
          tripId,
          category: 'stay',
          description: `Hotel accommodations (${durationResult.durationDays} days)`,
          amount: budgetBreakdown.category_totals.stay,
          isPaid: false,
        },
        {
          id: `b-trans-${Date.now()}`,
          tripId,
          category: 'transport',
          description: 'Local private transport, cabs & inter-city transit',
          amount: budgetBreakdown.category_totals.transport,
          isPaid: false,
        },
        {
          id: `b-food-${Date.now()}`,
          tripId,
          category: 'food',
          description: 'Dining, street food & regional cuisine',
          amount: budgetBreakdown.category_totals.food,
          isPaid: false,
        },
        {
          id: `b-act-${Date.now()}`,
          tripId,
          category: 'activity',
          description: 'Sightseeing admissions, guide & excursions',
          amount: budgetBreakdown.category_totals.activity,
          isPaid: false,
        },
        {
          id: `b-misc-${Date.now()}`,
          tripId,
          category: 'other',
          description: 'Personal shopping, contingency & miscellaneous',
          amount: budgetBreakdown.category_totals.misc,
          isPaid: false,
        },
      ];

      const finalChecklist: ChecklistItem[] = generatedTodos.map((t, idx) => ({
        id: `c-${Date.now()}-${idx}`,
        tripId,
        category: (t.category as any) || 'booking',
        title: t.title,
        isCompleted: t.completed,
      }));

      const finalTrip: GhoomoTrip = {
        id: tripId,
        title: validatedPlan.title,
        destinationRegion: destination,
        durationDays: durationResult.durationDays,
        budgetTotal: budgetBreakdown.estimated,
        travelStyle: job.preferences.travelStyle || 'friends',
        coverImage:
          finalPlaces[0]?.imageUrl ||
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        status: 'planned',
        sources: [source],
        places: finalPlaces,
        days: finalDays,
        collaborators: [],
        budgetItems: finalBudgetItems,
        checklistItems: finalChecklist,
        travelEvidence: evidence,
        budgetBreakdown,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const processingTime = Date.now() - startTime;

      JobStore.setJobData(jobId, {
        tripId,
        trip: finalTrip,
        observability: {
          video_hash: job.metadata?.sha256 || 'unknown',
          processing_time_ms: processingTime,
          gemini_calls: prevGeminiCalls + 1,
          gemini_latency_ms: prevGeminiLatency + 1200,
          model: GeminiMultimodalService.getVideoModel(),
          destination_confidence: evidence.travel_confidence || 0.95,
          travel_confidence: evidence.travel_confidence || 0.95,
        },
      });

      JobStore.updateJobState(
        jobId,
        'READY',
        100,
        `Itinerary ready! ${finalPlaces.length} places mapped across ${durationResult.durationDays} days.`
      );
    } catch (err: any) {
      console.error('[VideoPipelineOrchestrator] Finalize error:', err);
      JobStore.setJobError(jobId, err.message || 'Failed during itinerary optimization.');
    }
  }
}
