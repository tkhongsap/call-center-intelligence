/**
 * Alert Computation Script
 *
 * Runs all alert detection algorithms and saves generated alerts to the database.
 * This script can be run manually or scheduled as a cron job.
 *
 * Run with: npm run compute-alerts
 *
 * Options via environment variables:
 * - TIME_WINDOW: 'hourly' | 'daily' | 'weekly' (default: 'daily')
 * - ALERT_TYPES: comma-separated list of alert types to compute (default: all)
 *   e.g., ALERT_TYPES=spike,threshold npm run compute-alerts
 * - DRY_RUN: 'true' to detect alerts without saving (default: false)
 */

import {
  generateSpikeAlerts,
  generateThresholdAlerts,
  generateUrgencyAlerts,
  generateMisclassificationAlerts,
  detectSpikeAlerts,
  detectThresholdAlerts,
  detectUrgencyAlerts,
  detectMisclassificationAlerts,
  TimeWindow,
  ALERT_CONFIG,
} from '../alerts';

type AlertType = 'spike' | 'threshold' | 'urgency' | 'misclassification';

const ALL_ALERT_TYPES: AlertType[] = ['spike', 'threshold', 'urgency', 'misclassification'];

interface ComputeResult {
  type: AlertType;
  detected: number;
  saved: number;
  duration: number;
}

/**
 * Parse command line options from environment variables
 */
function parseOptions(): {
  timeWindow: TimeWindow;
  alertTypes: AlertType[];
  dryRun: boolean;
} {
  const timeWindow = (process.env.TIME_WINDOW || 'daily') as TimeWindow;

  // Validate time window
  if (!['hourly', 'daily', 'weekly'].includes(timeWindow)) {
    console.error(`Invalid TIME_WINDOW: ${timeWindow}. Must be 'hourly', 'daily', or 'weekly'.`);
    process.exit(1);
  }

  // Parse alert types
  let alertTypes: AlertType[] = ALL_ALERT_TYPES;
  if (process.env.ALERT_TYPES) {
    alertTypes = process.env.ALERT_TYPES.split(',').map(t => t.trim().toLowerCase() as AlertType);
    const invalidTypes = alertTypes.filter(t => !ALL_ALERT_TYPES.includes(t));
    if (invalidTypes.length > 0) {
      console.error(`Invalid ALERT_TYPES: ${invalidTypes.join(', ')}. Valid types: ${ALL_ALERT_TYPES.join(', ')}`);
      process.exit(1);
    }
  }

  const dryRun = process.env.DRY_RUN === 'true';

  return { timeWindow, alertTypes, dryRun };
}

/**
 * Compute spike alerts
 */
async function computeSpikeAlerts(timeWindow: TimeWindow, dryRun: boolean): Promise<ComputeResult> {
  const start = Date.now();

  if (dryRun) {
    const detected = await detectSpikeAlerts(timeWindow);
    return {
      type: 'spike',
      detected: detected.length,
      saved: 0,
      duration: Date.now() - start,
    };
  }

  const alerts = await generateSpikeAlerts(timeWindow);
  return {
    type: 'spike',
    detected: alerts.length,
    saved: alerts.length,
    duration: Date.now() - start,
  };
}

/**
 * Compute threshold alerts
 */
async function computeThresholdAlerts(timeWindow: TimeWindow, dryRun: boolean): Promise<ComputeResult> {
  const start = Date.now();

  if (dryRun) {
    const detected = await detectThresholdAlerts(timeWindow);
    return {
      type: 'threshold',
      detected: detected.length,
      saved: 0,
      duration: Date.now() - start,
    };
  }

  const alerts = await generateThresholdAlerts(timeWindow);
  return {
    type: 'threshold',
    detected: alerts.length,
    saved: alerts.length,
    duration: Date.now() - start,
  };
}

/**
 * Compute urgency alerts
 */
async function computeUrgencyAlerts(timeWindow: TimeWindow, dryRun: boolean): Promise<ComputeResult> {
  const start = Date.now();

  if (dryRun) {
    const detected = await detectUrgencyAlerts(timeWindow);
    return {
      type: 'urgency',
      detected: detected.length,
      saved: 0,
      duration: Date.now() - start,
    };
  }

  const alerts = await generateUrgencyAlerts(timeWindow);
  return {
    type: 'urgency',
    detected: alerts.length,
    saved: alerts.length,
    duration: Date.now() - start,
  };
}

/**
 * Compute misclassification alerts
 */
async function computeMisclassificationAlerts(timeWindow: TimeWindow, dryRun: boolean): Promise<ComputeResult> {
  const start = Date.now();

  if (dryRun) {
    const detected = await detectMisclassificationAlerts(timeWindow);
    return {
      type: 'misclassification',
      detected: detected.length,
      saved: 0,
      duration: Date.now() - start,
    };
  }

  const alerts = await generateMisclassificationAlerts(timeWindow);
  return {
    type: 'misclassification',
    detected: alerts.length,
    saved: alerts.length,
    duration: Date.now() - start,
  };
}

/**
 * Main execution function
 */
async function main() {
  const { timeWindow, alertTypes, dryRun } = parseOptions();

  console.log('\n='.repeat(60));
  console.log('Alert Computation Script');
  console.log('='.repeat(60));
  console.log(`Time Window: ${timeWindow}`);
  console.log(`Alert Types: ${alertTypes.join(', ')}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no saves)' : 'LIVE (saving to database)'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('-'.repeat(60));

  // Display configuration
  console.log('\nConfiguration:');
  console.log(`  Spike factor: ${ALERT_CONFIG.spike.factor}x (${(ALERT_CONFIG.spike.factor - 1) * 100}% increase)`);
  console.log(`  Spike min baseline: ${ALERT_CONFIG.spike.minBaseline} cases`);
  console.log(`  Default thresholds: hourly=${ALERT_CONFIG.threshold.defaults.hourly}, daily=${ALERT_CONFIG.threshold.defaults.daily}, weekly=${ALERT_CONFIG.threshold.defaults.weekly}`);
  console.log(`  Urgency keywords: ${ALERT_CONFIG.urgency.riskKeywords.slice(0, 5).join(', ')}...`);
  console.log(`  Misclassification keywords: ${ALERT_CONFIG.misclassification.riskKeywords.slice(0, 5).join(', ')}...`);
  console.log('-'.repeat(60));

  const results: ComputeResult[] = [];
  const computeFunctions: Record<AlertType, (tw: TimeWindow, dr: boolean) => Promise<ComputeResult>> = {
    spike: computeSpikeAlerts,
    threshold: computeThresholdAlerts,
    urgency: computeUrgencyAlerts,
    misclassification: computeMisclassificationAlerts,
  };

  // Run each alert type computation
  for (const alertType of alertTypes) {
    console.log(`\nComputing ${alertType} alerts...`);
    try {
      const result = await computeFunctions[alertType](timeWindow, dryRun);
      results.push(result);
      console.log(`  Detected: ${result.detected}`);
      console.log(`  Saved: ${result.saved}`);
      console.log(`  Duration: ${result.duration}ms`);
    } catch (error) {
      console.error(`  Error computing ${alertType} alerts:`, error);
      results.push({
        type: alertType,
        detected: 0,
        saved: 0,
        duration: 0,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  let totalDetected = 0;
  let totalSaved = 0;
  let totalDuration = 0;

  for (const result of results) {
    console.log(`  ${result.type.padEnd(20)} Detected: ${String(result.detected).padStart(4)} | Saved: ${String(result.saved).padStart(4)} | ${result.duration}ms`);
    totalDetected += result.detected;
    totalSaved += result.saved;
    totalDuration += result.duration;
  }

  console.log('-'.repeat(60));
  console.log(`  ${'TOTAL'.padEnd(20)} Detected: ${String(totalDetected).padStart(4)} | Saved: ${String(totalSaved).padStart(4)} | ${totalDuration}ms`);
  console.log('='.repeat(60));
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log('');

  // Exit with appropriate code
  if (totalDetected === 0) {
    console.log('No alerts detected. This may be normal if there are no anomalies.');
  }

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
