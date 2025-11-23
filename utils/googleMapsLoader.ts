let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
    if (isLoaded) {
        return Promise.resolve();
    }

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;

    loadPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            isLoaded = true;
            isLoading = false;
            resolve();
            return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            reject(new Error('Google Places API key not configured'));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            isLoaded = true;
            isLoading = false;
            resolve();
        };

        script.onerror = (err) => {
            isLoading = false;
            reject(err);
        };

        document.head.appendChild(script);
    });

    return loadPromise;
};

// Type definitions for window.google
declare global {
    interface Window {
        google: any;
    }
}
