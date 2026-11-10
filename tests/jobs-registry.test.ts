import { describe, expect, it } from 'vitest';
import { isJobName, JOB_SCHEMAS, runJob } from '@/lib/jobs/registry';

describe('jobs registry', () => {
  it('recognizes only registered jobs', () => {
    expect(isJobName('alerts.check')).toBe(true);
    expect(isJobName('rm -rf')).toBe(false);
    expect(isJobName('toString')).toBe(false);
  });

  it('rejects invalid payloads before running any handler', async () => {
    await expect(runJob('alerts.check', { workspaceId: '' })).rejects.toThrow();
    await expect(
      runJob('scheduled-emails.run', { scheduledEmailId: 'x', nextRun: 'ontem' }),
    ).rejects.toThrow();
  });

  it('accepts a valid actor payload shape', () => {
    expect(JOB_SCHEMAS['alerts.check'].safeParse({ workspaceId: 'w', userId: 'u' }).success).toBe(
      true,
    );
  });
});
