<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Rooh. The setup covers both client-side and server-side tracking, using `posthog-js` (already present) for browser events and the newly installed `posthog-node` for server-side API route events. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 16+), with a reverse proxy configured in `next.config.ts` to route all ingestion through `/ingest` — improving ad-blocker resilience and data quality. Exception capture is enabled automatically via `capture_exceptions: true`.

## Files created or modified

| File | Change |
|---|---|
| `instrumentation-client.ts` | Created — initialises PostHog client-side with proxy host, exception capture, and debug mode |
| `next.config.ts` | Updated — added `/ingest` rewrites for the PostHog reverse proxy |
| `src/lib/posthog-server.ts` | Created — singleton `getPostHogClient()` helper for server-side event capture |
| `src/app/page.tsx` | Updated — added `archive_opened` capture on "Open archive" button click |
| `src/app/dashboard/page.tsx` | Updated — added `recording_filter_changed` and `recording_expanded` capture |
| `src/app/api/whatsapp/route.ts` | Updated — added `whatsapp_message_received` and `recording_saved` server-side capture |
| `src/app/api/test-recording/route.ts` | Updated — added `test_recording_submitted` server-side capture |
| `.env.local` | Updated — set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Events instrumented

| Event | Description | File |
|---|---|---|
| `archive_opened` | User clicks "Open archive" on the home page | `src/app/page.tsx` |
| `recording_filter_changed` | User changes the type filter tab in the dashboard (all/story/practical/legacy) | `src/app/dashboard/page.tsx` |
| `recording_expanded` | User expands a recording card to read its transcript and summary | `src/app/dashboard/page.tsx` |
| `whatsapp_message_received` | An audio message is received from a parent via WhatsApp webhook | `src/app/api/whatsapp/route.ts` |
| `recording_saved` | A recording has been fully processed and saved to the database | `src/app/api/whatsapp/route.ts` |
| `test_recording_submitted` | A test recording is submitted via the test-recording API endpoint | `src/app/api/test-recording/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/368843/dashboard/1430394
- **Recordings saved over time**: https://us.posthog.com/project/368843/insights/CXs8KyU9
- **Archive engagement: opens vs. recordings explored**: https://us.posthog.com/project/368843/insights/UI4qfkhf
- **WhatsApp → saved recording conversion** (funnel): https://us.posthog.com/project/368843/insights/5jAXtdvM
- **Recordings by type** (pie breakdown by primary_type): https://us.posthog.com/project/368843/insights/cVyXru8Q
- **Most-used archive filter tabs** (bar breakdown by filter): https://us.posthog.com/project/368843/insights/1lMOBiXt

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
