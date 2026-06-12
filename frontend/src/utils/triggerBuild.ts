export const triggerNetlifyBuild = async () => {
  // Compatible with Vite (import.meta.env) and Next.js (process.env)
  const buildHookUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NETLIFY_BUILD_HOOK) ||
    (typeof process !== 'undefined' && process.env?.VITE_NETLIFY_BUILD_HOOK) ||
    undefined;
  
  if (!buildHookUrl) {
    console.warn('No Netlify Build Hook URL configured. Site will not rebuild automatically.');
    return;
  }

  try {
    const response = await fetch(buildHookUrl, {
      method: 'POST',
    });
    
    if (response.ok) {
      console.log('Netlify build triggered successfully');
    } else {
      console.error('Failed to trigger Netlify build:', response.statusText);
    }
  } catch (error) {
    console.error('Error triggering Netlify build:', error);
  }
};
