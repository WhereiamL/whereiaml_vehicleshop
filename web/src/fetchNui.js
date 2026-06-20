const resourceName = typeof GetParentResourceName === 'function'
  ? GetParentResourceName()
  : 'whereiaml_vehicleshop';

export async function fetchNui(callback, data) {
  try {
    const resp = await fetch(`https://${resourceName}/${callback}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data ?? {}),
    });
    return await resp.json();
  } catch {
    return null;
  }
}

export const isBrowser = !window.invokeNative;
