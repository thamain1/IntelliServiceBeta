import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let googleMapsPromise: Promise<typeof google> | null = null;

export async function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  console.log('[Google Maps] API Key check:', apiKey ? 'Key is present' : 'Key is missing');
  console.log('[Google Maps] API Key length:', apiKey?.length);
  console.log('[Google Maps] First 10 chars:', apiKey?.substring(0, 10));

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
  }

  try {
    googleMapsPromise = (async () => {
      console.log('[Google Maps] Setting options with key:', apiKey.substring(0, 10) + '...');
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      console.log('[Google Maps] Loading maps library...');
      await importLibrary('maps');
      console.log('[Google Maps] Loading marker library...');
      await importLibrary('marker');

      console.log('[Google Maps] All libraries loaded successfully');
      console.log('[Google Maps] Verify the request URL includes: ?key=' + apiKey.substring(0, 10) + '...');

      return google;
    })();

    return googleMapsPromise;
  } catch (error: unknown) {
    console.error('[Google Maps] Failed to load Google Maps:', error);
    throw new Error(`Google Maps initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
