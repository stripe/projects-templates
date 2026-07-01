import Mixpanel from 'mixpanel';

let mixpanelClient: Mixpanel.Mixpanel | null = null;

export function getMixpanelClient() {
  if (!mixpanelClient) {
    mixpanelClient = Mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
      host: process.env.MIXPANEL_API_HOST || 'api.mixpanel.com',
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
