/**
 * Ghoomo Mastery Policy Manager
 * Per-concept and per-domain mastery requirements.
 * Resolves policy chain: concept → domain → global default.
 */

export interface MasteryPolicy {
  requiredEvidenceTypes: string[];
  minimumScore: number;         // 0-100
  minimumConfidence: number;    // 0.0-1.0
  minimumDistinctEvidence: number;
}

/** Global default policy applied when no concept or domain policy exists */
const GLOBAL_DEFAULT_POLICY: MasteryPolicy = {
  requiredEvidenceTypes: ['practice'],
  minimumScore: 85,
  minimumConfidence: 0.85,
  minimumDistinctEvidence: 2,
};

/** Domain-level default policies */
const DOMAIN_POLICIES: Record<string, Partial<MasteryPolicy>> = {
  'computer science': {
    requiredEvidenceTypes: ['practice', 'application'],
    minimumDistinctEvidence: 2,
  },
  'data structures': {
    requiredEvidenceTypes: ['practice', 'application'],
    minimumScore: 85,
    minimumDistinctEvidence: 2,
  },
  'algorithms': {
    requiredEvidenceTypes: ['practice', 'application'],
    minimumScore: 85,
    minimumDistinctEvidence: 2,
  },
  'mathematics': {
    requiredEvidenceTypes: ['practice'],
    minimumScore: 90,
    minimumConfidence: 0.90,
    minimumDistinctEvidence: 3,
  },
  'science': {
    requiredEvidenceTypes: ['practice', 'application'],
    minimumDistinctEvidence: 2,
  },
  'language': {
    requiredEvidenceTypes: ['practice'],
    minimumScore: 80,
    minimumConfidence: 0.80,
    minimumDistinctEvidence: 2,
  },
  'programming': {
    requiredEvidenceTypes: ['practice', 'application'],
    minimumScore: 85,
    minimumDistinctEvidence: 2,
  },
};

/**
 * Resolves the mastery policy for a given concept.
 * Resolution chain: concept-specific → domain → global default.
 *
 * @param conceptPolicy - Concept-specific override (from DB mastery_policies table)
 * @param domain - The concept's domain for domain-level fallback
 * @returns Fully resolved MasteryPolicy
 */
export function resolveMasteryPolicy(
  conceptPolicy: Partial<MasteryPolicy> | null,
  domain: string
): MasteryPolicy {
  const domainKey = domain.toLowerCase().trim();
  const domainPolicy = DOMAIN_POLICIES[domainKey] || {};

  return {
    requiredEvidenceTypes:
      conceptPolicy?.requiredEvidenceTypes ??
      domainPolicy.requiredEvidenceTypes ??
      GLOBAL_DEFAULT_POLICY.requiredEvidenceTypes,

    minimumScore:
      conceptPolicy?.minimumScore ??
      domainPolicy.minimumScore ??
      GLOBAL_DEFAULT_POLICY.minimumScore,

    minimumConfidence:
      conceptPolicy?.minimumConfidence ??
      domainPolicy.minimumConfidence ??
      GLOBAL_DEFAULT_POLICY.minimumConfidence,

    minimumDistinctEvidence:
      conceptPolicy?.minimumDistinctEvidence ??
      domainPolicy.minimumDistinctEvidence ??
      GLOBAL_DEFAULT_POLICY.minimumDistinctEvidence,
  };
}

/**
 * Checks whether a learner has met the mastery policy for a concept.
 * Returns both the result and a human-readable explanation.
 */
export function checkMasteryAgainstPolicy(params: {
  policy: MasteryPolicy;
  masteryScore: number;
  confidenceScore: number;
  evidenceCount: number;
  evidenceTypes: string[];
  verifiedApplication?: boolean;
}): {
  isSatisfied: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isSatisfied = true;

  // 1. Score check
  if (params.masteryScore < params.policy.minimumScore) {
    isSatisfied = false;
    reasons.push(
      `Score ${params.masteryScore}% is below the required ${params.policy.minimumScore}%`
    );
  }

  // 2. Confidence check
  if (params.confidenceScore < params.policy.minimumConfidence) {
    isSatisfied = false;
    reasons.push(
      `Confidence ${(params.confidenceScore * 100).toFixed(0)}% is below the required ${(params.policy.minimumConfidence * 100).toFixed(0)}%`
    );
  }

  // 3. Evidence count check
  if (params.evidenceCount < params.policy.minimumDistinctEvidence) {
    isSatisfied = false;
    reasons.push(
      `${params.evidenceCount} evidence submissions, need at least ${params.policy.minimumDistinctEvidence}`
    );
  }

  // 4. Evidence type coverage check
  const coveredTypes = new Set(params.evidenceTypes);
  const missingTypes = params.policy.requiredEvidenceTypes.filter(
    (t) => !coveredTypes.has(t)
  );
  if (missingTypes.length > 0) {
    // Application requirement can be satisfied by verifiedApplication flag
    const actuallyMissing = missingTypes.filter(
      (t) => !(t === 'application' && params.verifiedApplication)
    );
    if (actuallyMissing.length > 0) {
      isSatisfied = false;
      reasons.push(
        `Missing evidence types: ${actuallyMissing.join(', ')}`
      );
    }
  }

  if (isSatisfied) {
    reasons.push('All mastery requirements satisfied');
  }

  return { isSatisfied, reasons };
}

export { GLOBAL_DEFAULT_POLICY, DOMAIN_POLICIES };
