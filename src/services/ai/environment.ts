const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export const isLocalHostname = (hostname: string) => LOCAL_HOSTNAMES.has(hostname.toLowerCase());

export const isLocalAIEnvironment = () => {
    if (typeof window === 'undefined') return false;

    return isLocalHostname(window.location.hostname);
};
