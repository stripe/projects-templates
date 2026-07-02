import Mixpanel from 'mixpanel';

let mixpanelClient: Mixpanel.Mixpanel | null = null;

function resolveMixpanelHost() {
  const rawHost =
    process.env.MIXPANEL_INGESTION_URL ||
    process.env.MIXPANEL_API_URL ||
    process.env.MIXPANEL_API_HOST ||
    'api.mixpanel.com';

  return rawHost.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function getMixpanelClient() {
  if (!mixpanelClient) {
    mixpanelClient = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN!, {
      host: resolveMixpanelHost(),
    });
  }

  return mixpanelClient;
}

export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getMixpanelClient();
  client.track(event, {
    distinct_id: distinctId,
    ...properties,
  });
}

export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const client = getMixpanelClient();
  client.people.set(distinctId, properties || {});
}
