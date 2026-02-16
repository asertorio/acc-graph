import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

let registered = false;

export function registerExtensions(): void {
  if (registered) return;
  cytoscape.use(coseBilkent);
  registered = true;
}
